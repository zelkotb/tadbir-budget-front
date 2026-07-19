import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { minDuration } from '@/app/utils/rxjs.utils';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { AuditService } from '../audit.service';
import { AuthAuditResponse, AuditQuery, AuthEventType } from '../audit.models';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        TableModule,
        SkeletonModule,
        TagModule,
        TooltipModule,
        SelectModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ButtonModule,
        TranslatePipe
    ],
    templateUrl: './audit-logs.component.html'
})
export class AuditLogs implements OnInit, OnDestroy {
    private auditService = inject(AuditService);
    private router       = inject(Router);
    private route        = inject(ActivatedRoute);

    // ── State ──────────────────────────────────────────────────────────────────
    readonly logs         = signal<AuthAuditResponse[]>([]);
    readonly loading      = signal(true);
    readonly totalRecords = signal(0);

    // PrimeNG's TableBody renders `loadingBodyTemplate` (which we don't define) instead of
    // our `#body` template whenever `rowData` is falsy — so placeholders must be truthy.
    readonly skeletonRows = Array(10).fill(true);

    currentPage  = 0;
    rowsPerPage  = 10;
    first        = 0;                   // bound to [first] on p-table for page restore

    actorFilter = '';
    ipFilter    = '';
    dateFilter  = '';

    readonly eventTypeFilter = signal<AuthEventType | null>(null);
    readonly successFilter   = signal<boolean | null>(null);

    get selectedEventType(): AuthEventType | null { return this.eventTypeFilter(); }
    set selectedEventType(v: AuthEventType | null) { this.eventTypeFilter.set(v); }

    readonly eventTypeOptions: { label: string; value: AuthEventType }[] = [
        { label: 'LOGIN',          value: 'LOGIN'          },
        { label: 'LOGOUT',         value: 'LOGOUT'         },
        { label: 'TOKEN_REFRESH',  value: 'TOKEN_REFRESH'  }
    ];

    readonly eventSeverity: Record<AuthEventType, TagSeverity> = {
        LOGIN:         'success',
        LOGOUT:        'secondary',
        TOKEN_REFRESH: 'info'
    };

    // ── Streams ────────────────────────────────────────────────────────────────
    private readonly reload$      = new Subject<void>();
    private readonly actorChange$ = new Subject<string>();
    private readonly ipChange$    = new Subject<string>();
    private readonly dateChange$  = new Subject<string>();
    private readonly _subs        = new Subscription();

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.restoreFromUrl();

        this._subs.add(
            this.reload$.pipe(
                switchMap(() => {
                    this.loading.set(true);
                    this.syncUrl();
                    return this.auditService.getAudit(this.buildQuery()).pipe(
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
            this.actorChange$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((v) => {
                this.actorFilter = v;
                this.currentPage = 0;
                this.first       = 0;
                this.reload$.next();
            })
        );

        this._subs.add(
            this.ipChange$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((v) => {
                this.ipFilter    = v;
                this.currentPage = 0;
                this.first       = 0;
                this.reload$.next();
            })
        );

        this._subs.add(
            this.dateChange$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((v) => {
                this.dateFilter  = v;
                this.currentPage = 0;
                this.first       = 0;
                this.reload$.next();
            })
        );

        this.reload$.next();
    }

    ngOnDestroy(): void {
        this._subs.unsubscribe();
    }

    // ── Handlers ───────────────────────────────────────────────────────────────
    onActorInput(value: string): void { this.actorChange$.next(value); }
    onIpInput(value: string):    void { this.ipChange$.next(value); }
    onDateInput(value: string):  void { this.dateChange$.next(value); }

    onEventTypeChange(): void {
        this.currentPage = 0;
        this.first       = 0;
        this.reload$.next();
    }

    setSuccessFilter(value: boolean | null): void {
        this.successFilter.set(value);
        this.currentPage = 0;
        this.first       = 0;
        this.reload$.next();
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.currentPage = Math.floor((event.first ?? 0) / this.rowsPerPage);
        this.first       = event.first ?? 0;
        this.reload$.next();
    }

    // ── URL state ──────────────────────────────────────────────────────────────
    private restoreFromUrl(): void {
        const p = this.route.snapshot.queryParams;
        this.actorFilter = p['actor'] ?? '';
        this.ipFilter    = p['ip']    ?? '';
        this.dateFilter  = p['date']  ?? '';
        this.eventTypeFilter.set((p['type'] as AuthEventType) ?? null);
        this.successFilter.set(p['success'] != null ? p['success'] === 'true' : null);
        this.currentPage = +(p['page'] ?? 0);
        this.first       = this.currentPage * this.rowsPerPage;
    }

    private syncUrl(): void {
        const qp: Record<string, string | null> = {
            actor:   this.actorFilter            || null,
            ip:      this.ipFilter               || null,
            date:    this.dateFilter             || null,
            type:    this.eventTypeFilter()      ?? null,
            success: this.successFilter() != null ? String(this.successFilter()) : null,
            page:    this.currentPage > 0        ? String(this.currentPage) : null
        };
        this.router.navigate([], {
            relativeTo:          this.route,
            queryParams:         qp,
            queryParamsHandling: 'merge',
            replaceUrl:          true
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    private buildQuery(): AuditQuery {
        return {
            actor:     this.actorFilter       || undefined,
            ipAddress: this.ipFilter          || undefined,
            date:      this.dateFilter        || undefined,
            eventType: this.eventTypeFilter() ?? undefined,
            success:   this.successFilter()   ?? undefined,
            page:      this.currentPage,
            size:      this.rowsPerPage,
            sort:      'occurredAt,desc'
        };
    }

    getSeverity(eventType: string): TagSeverity {
        return this.eventSeverity[eventType as AuthEventType] ?? 'secondary';
    }

    truncate(text: string, max = 55): string {
        return text.length > max ? text.slice(0, max) + '…' : text;
    }
}
