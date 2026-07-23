import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { minDuration } from '@/app/utils/rxjs.utils';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService } from '@/app/pages/users/user.service';
import { UserAuditResponse, UserAuditQuery, AuditAction } from '@/app/models/user.model';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Component({
    selector: 'app-user-audit-logs',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        TableModule,
        SkeletonModule,
        TooltipModule,
        SelectModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        DatePickerModule,
        TranslatePipe
    ],
    templateUrl: './user-audit-logs.component.html'
})
export class UserAuditLogs implements OnInit, OnDestroy {
    private userService = inject(UserService);
    private router      = inject(Router);
    private route       = inject(ActivatedRoute);

    // ── State ──────────────────────────────────────────────────────────────────
    readonly logs         = signal<UserAuditResponse[]>([]);
    readonly loading      = signal(true);
    readonly totalRecords = signal(0);

    currentPage = 0;
    rowsPerPage = 10;
    first       = 0;

    performedByFilter = '';
    ipFilter          = '';
    userIdFilter   = '';
    dateFilter: Date | null = null;

    readonly actionFilter = signal<AuditAction | null>(null);

    get selectedAction(): AuditAction | null { return this.actionFilter(); }
    set selectedAction(v: AuditAction | null) { this.actionFilter.set(v); }

    readonly actionOptions: { label: string; value: AuditAction }[] = [
        { label: 'CREATE', value: 'CREATE' },
        { label: 'UPDATE', value: 'UPDATE' },
        { label: 'DELETE', value: 'DELETE' }
    ];

    readonly actionSeverity: Record<AuditAction, TagSeverity> = {
        CREATE: 'success',
        UPDATE: 'warn',
        DELETE: 'danger'
    };

    // PrimeNG's TableBody renders `loadingBodyTemplate` (which we don't define) instead of
    // our `#body` template whenever `rowData` is falsy — so placeholders must be truthy.
    readonly skeletonRows = Array(10).fill(true);

    // ── Streams ────────────────────────────────────────────────────────────────
    private readonly reload$           = new Subject<void>();
    private readonly performedByChange$ = new Subject<string>();
    private readonly ipChange$          = new Subject<string>();
    private readonly userIdChange$   = new Subject<string>();
    private readonly _subs              = new Subscription();

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.restoreFromUrl();

        this._subs.add(
            this.reload$.pipe(
                switchMap(() => {
                    this.loading.set(true);
                    this.syncUrl();
                    return this.userService.getUserAudit(this.buildQuery()).pipe(
                        catchError(() => of(null)),
                        minDuration(400)
                    );
                })
            ).subscribe((page) => {
                if (page) {
                    this.logs.set(page.content);
                    this.totalRecords.set(page.totalElements);
                }
                this.loading.set(false);
            })
        );

        this._subs.add(
            this.performedByChange$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((v) => {
                this.performedByFilter = v; this.currentPage = 0; this.first = 0; this.reload$.next();
            })
        );
        this._subs.add(
            this.ipChange$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((v) => {
                this.ipFilter = v; this.currentPage = 0; this.first = 0; this.reload$.next();
            })
        );
        this._subs.add(
            this.userIdChange$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((v) => {
                this.userIdFilter = v; this.currentPage = 0; this.first = 0; this.reload$.next();
            })
        );

        this.reload$.next();
    }

    ngOnDestroy(): void { this._subs.unsubscribe(); }

    // ── Handlers ───────────────────────────────────────────────────────────────
    onPerformedByInput(v: string): void  { this.performedByChange$.next(v); }
    onIpInput(v: string):          void  { this.ipChange$.next(v); }
    onUserIdInput(v: string):   void  { this.userIdChange$.next(v); }

    onActionChange(): void {
        this.currentPage = 0; this.first = 0; this.reload$.next();
    }

    onDateSelect(): void {
        this.currentPage = 0; this.first = 0; this.reload$.next();
    }

    onDateClear(): void {
        this.dateFilter  = null;
        this.currentPage = 0; this.first = 0; this.reload$.next();
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.currentPage = Math.floor((event.first ?? 0) / this.rowsPerPage);
        this.first       = event.first ?? 0;
        this.reload$.next();
    }

    viewDetail(revisionId: number): void {
        this.router.navigate(['/audit/user-audit', revisionId], { queryParams: this.route.snapshot.queryParams });
    }

    getSeverity(action: string): TagSeverity {
        return this.actionSeverity[action as AuditAction] ?? 'secondary';
    }

    /** Audit action → Poseidon pill class. */
    actionPillClass(action: string): string {
        switch (action) {
            case 'CREATE': return 'a-pill ac-create';
            case 'UPDATE': return 'a-pill ac-update';
            case 'DELETE': return 'a-pill ac-delete';
            default:       return 'a-pill ev-default';
        }
    }

    // ── URL state ──────────────────────────────────────────────────────────────
    private restoreFromUrl(): void {
        const p = this.route.snapshot.queryParams;
        this.performedByFilter = p['by']     ?? '';
        this.ipFilter          = p['ip']     ?? '';
        this.userIdFilter   = p['uid'] ?? '';
        this.actionFilter.set((p['action'] as AuditAction) ?? null);
        if (p['date']) {
            const [dd, mm, yyyy] = p['date'].split('/');
            const d = new Date(+yyyy, +mm - 1, +dd);
            this.dateFilter = isNaN(d.getTime()) ? null : d;
        }
        this.currentPage = +(p['page'] ?? 0);
        this.first       = this.currentPage * this.rowsPerPage;
    }

    private syncUrl(): void {
        this.router.navigate([], {
            relativeTo:          this.route,
            queryParams:         {
                by:     this.performedByFilter || null,
                ip:     this.ipFilter          || null,
                uid: this.userIdFilter   || null,
                action: this.actionFilter()    ?? null,
                date:   this.dateFilter ? this.formatDate(this.dateFilter) : null,
                page:   this.currentPage > 0 ? String(this.currentPage) : null
            },
            queryParamsHandling: 'merge',
            replaceUrl:          true
        });
    }

    private buildQuery(): UserAuditQuery {
        return {
            performedBy: this.performedByFilter || undefined,
            ip:          this.ipFilter          || undefined,
            userId:   this.userIdFilter   || undefined,
            action:      this.actionFilter()    ?? undefined,
            date:        this.dateFilter ? this.formatDate(this.dateFilter) : undefined,
            page:        this.currentPage,
            size:        this.rowsPerPage,
            sort:        'occurredAt,desc'
        };
    }

    private formatDate(d: Date): string {
        const dd   = String(d.getDate()).padStart(2, '0');
        const mm   = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    truncate(text: string, max = 40): string {
        return text?.length > max ? text.slice(0, max) + '…' : (text ?? '');
    }
}
