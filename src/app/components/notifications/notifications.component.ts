import { Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationView } from './notification.model';
import { LanguageService } from '@/app/services/language.service';
import { ToastService } from '@/app/services/toast.service';
import { AuthService } from '@/app/pages/auth/auth.service';
import { DayBucket, dayBucket, relativeTime } from '@/app/utils/relative-time.util';
import { NotificationService } from './notification.service';
import { humanizeCategory, notifVisual, requiresAction } from './notification-category.config';

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 60_000;

type NotifFilter = 'all' | 'unread' | 'val';

/** A day-bucketed slice of the filtered list, rendered under a sticky header. */
interface NotifGroup {
    bucket: DayBucket;
    items:  NotificationView[];
}

const BUCKET_ORDER: DayBucket[] = ['today', 'yesterday', 'week', 'older'];

/**
 * Self-contained notification bell + dropdown panel for the topbar.
 *
 * - Bell shows the unread count badge (capped at "99+"), hidden when 0.
 * - The unread count is loaded on mount, polled every ~60s, refreshed when the
 *   panel opens, and reconciled after every mark action — single source of truth
 *   for the badge.
 * - The panel lazy-loads notifications (page 0, size 10) and appends via
 *   "Load more"; it never auto-marks anything read just for opening.
 * - Filter tabs (Toutes / Non lues / À valider), day-grouped sticky headers,
 *   per-row mark-read, and routing to the request detail are all driven from the
 *   live list + the central category config.
 */
@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, TooltipModule, TranslatePipe],
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
    private notificationService = inject(NotificationService);
    private languageService     = inject(LanguageService);
    private toast               = inject(ToastService);
    private translate           = inject(TranslateService);
    private auth                = inject(AuthService);
    private router              = inject(Router);
    private destroyRef          = inject(DestroyRef);
    private host                = inject<ElementRef<HTMLElement>>(ElementRef);

    // ── UI state ────────────────────────────────────────────────────────────
    readonly open        = signal(false);
    readonly unreadCount = signal(0);
    readonly items       = signal<NotificationView[]>([]);
    readonly loading     = signal(false);   // initial list load
    readonly loadingMore = signal(false);   // "Load more"
    readonly markingAll  = signal(false);
    readonly error       = signal(false);
    readonly last        = signal(true);
    readonly filter      = signal<NotifFilter>('all');

    private page = 0;
    private pollTimer?: ReturnType<typeof setInterval>;

    /** Badge text, capped at "99+". */
    readonly badgeText = computed(() => {
        const c = this.unreadCount();
        return c > 99 ? '99+' : String(c);
    });

    // ── Live counts (recomputed from the loaded list) ────────────────────────
    readonly countAll    = computed(() => this.items().length);
    readonly countUnread = computed(() => this.items().filter((n) => !n.read).length);
    readonly countVal    = computed(() => this.items().filter((n) => requiresAction(n.category)).length);

    /** The list after the active filter. */
    readonly filteredItems = computed(() => {
        const f = this.filter();
        return this.items().filter((n) =>
            f === 'all' ? true : f === 'unread' ? !n.read : requiresAction(n.category)
        );
    });

    /** Filtered list bucketed by day, in fixed order, skipping empty groups. */
    readonly groups = computed<NotifGroup[]>(() => {
        const byBucket = new Map<DayBucket, NotificationView[]>();
        for (const n of this.filteredItems()) {
            const b = dayBucket(n.createdAt);
            (byBucket.get(b) ?? byBucket.set(b, []).get(b)!).push(n);
        }
        return BUCKET_ORDER.filter((b) => byBucket.has(b)).map((bucket) => ({ bucket, items: byBucket.get(bucket)! }));
    });

    // ── Lifecycle ───────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.refreshCount();
        this.pollTimer = setInterval(() => this.refreshCount(), POLL_INTERVAL_MS);
    }

    ngOnDestroy(): void {
        if (this.pollTimer) clearInterval(this.pollTimer);
    }

    // ── Panel open / close ──────────────────────────────────────────────────
    toggle(): void {
        if (this.open()) this.close();
        else this.openPanel();
    }

    close(): void {
        this.open.set(false);
    }

    private openPanel(): void {
        this.open.set(true);
        this.refreshCount();   // reconcile badge against server on open
        this.loadInitial();    // always reload newest-first from page 0
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
            this.close();
        }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.open()) this.close();
    }

    // ── Data loading ────────────────────────────────────────────────────────
    private refreshCount(): void {
        this.notificationService.getUnreadCount()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (count) => this.unreadCount.set(Math.max(0, count)),
                error: () => { /* badge poll is best-effort; keep last known value */ }
            });
    }

    private loadInitial(): void {
        this.loading.set(true);
        this.error.set(false);
        this.page = 0;
        this.notificationService.getNotifications(0, PAGE_SIZE)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.items.set(res.content);
                    this.last.set(res.last);
                    this.page = res.number;
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.error.set(true);
                }
            });
    }

    retry(): void {
        this.loadInitial();
    }

    loadMore(): void {
        if (this.last() || this.loadingMore() || this.loading()) return;
        this.loadingMore.set(true);
        this.notificationService.getNotifications(this.page + 1, PAGE_SIZE)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.items.update((curr) => [...curr, ...res.content]);
                    this.last.set(res.last);
                    this.page = res.number;
                    this.loadingMore.set(false);
                },
                error: () => {
                    this.loadingMore.set(false);
                    this.toast.showError(this.translate.instant('notifications.mark_error'));
                }
            });
    }

    // ── Filter ──────────────────────────────────────────────────────────────
    setFilter(f: NotifFilter): void { this.filter.set(f); }

    // ── Read actions ────────────────────────────────────────────────────────
    /** Row click: mark read (if needed) then navigate to the request, if eligible. */
    onItemClick(item: NotificationView): void {
        if (!item.read) this.markOne(item);
        this.navigateTo(item);
    }

    /** Hover check button: mark read WITHOUT navigating, with a confirmation toast. */
    dismiss(event: MouseEvent, item: NotificationView): void {
        event.stopPropagation();
        if (item.read) return;
        this.markOne(item);
        this.toast.showSuccess(this.translate.instant('notifications.marked_one'));
    }

    markOne(item: NotificationView): void {
        if (item.read) return;

        // Optimistic: flip the item and decrement the badge (never below 0).
        this.setRead(item.id, true);
        this.unreadCount.update((c) => Math.max(0, c - 1));

        this.notificationService.markRead(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                error: () => {
                    this.setRead(item.id, false);                 // revert
                    this.unreadCount.update((c) => c + 1);
                    this.toast.showError(this.translate.instant('notifications.mark_error'));
                }
            });
    }

    markAll(): void {
        if (this.unreadCount() === 0 || this.markingAll()) return;

        const snapshot  = this.items();
        const prevCount = this.unreadCount();

        // Optimistic: mark every loaded item read and zero the badge.
        this.items.update((curr) =>
            curr.map((n) => (n.read ? n : { ...n, read: true, readAt: new Date().toISOString() }))
        );
        this.unreadCount.set(0);
        this.markingAll.set(true);

        this.notificationService.markAllRead()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.markingAll.set(false);
                    this.refreshCount();   // reconcile with server truth
                    this.toast.showSuccess(this.translate.instant('notifications.marked_all'));
                },
                error: () => {
                    this.items.set(snapshot);          // revert
                    this.unreadCount.set(prevCount);
                    this.markingAll.set(false);
                    this.toast.showError(this.translate.instant('notifications.mark_error'));
                }
            });
    }

    // ── Template helpers (delegate to the central category config) ───────────
    tone(category: string): string  { return notifVisual(category).tone; }
    icon(category: string): string  { return notifVisual(category).icon; }

    /** Localized tag label; falls back to a humanized category for unknown ones. */
    tag(category: string): string {
        const key = notifVisual(category).tagKey;
        return key ? this.translate.instant(key) : humanizeCategory(category);
    }

    bucketLabelKey(bucket: DayBucket): string {
        return 'notifications.group.' + bucket;
    }

    timeAgo(iso: string): string {
        return relativeTime(iso, this.languageService.currentLang().code);
    }

    // ── Footer ──────────────────────────────────────────────────────────────
    /** No dedicated notifications page route yet — close the panel as a stand-in. */
    viewAll(): void { this.close(); }

    // ── Internals ───────────────────────────────────────────────────────────
    private setRead(id: string, read: boolean): void {
        this.items.update((curr) =>
            curr.map((n) =>
                n.id === id ? { ...n, read, readAt: read ? new Date().toISOString() : null } : n
            )
        );
    }

    /**
     * Click-through for a notification. WORKFLOW_* notifications carry a
     * `referenceKey` pointing at a domain entity — the base app defines no entity
     * route, so this just closes the panel. Wire it to your entity's detail route
     * (e.g. `this.router.navigate(['/budgets', item.referenceKey])`) once it exists.
     */
    private navigateTo(item: NotificationView): void {
        if (!item.referenceKey || !item.category.startsWith('WORKFLOW_')) return;
        this.close();
    }
}
