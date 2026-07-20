import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { CreateOrgUnitInput, OrgUnit, OrgUnitMember, UpdateOrgUnitInput, buildOrgTree } from '@/app/models/org-unit.model';

const ORG_UNITS_PATH = '/org-units';

/**
 * Org-units client + signal store.
 *
 * The flat list (GET /org-units, tree order) is cached in a signal; `activeTree`
 * and `byId` are computed from it. Every mutation invalidates by refetching the
 * flat list (cheap), so the chart and every treeselect/name lookup stay in sync.
 * Reads are open to all authenticated users; writes are admin-only (server-enforced).
 */
@Injectable({ providedIn: 'root' })
export class OrgUnitService {
    private http = inject(HttpClient);

    private get silent(): HttpContext {
        return new HttpContext().set(SKIP_LOADING, true);
    }
    private url(suffix = ''): string {
        return `${environment.apiUrl}${ORG_UNITS_PATH}${suffix}`;
    }

    // ── Store ────────────────────────────────────────────────────────────────
    readonly units   = signal<OrgUnit[]>([]);
    readonly loaded  = signal(false);
    readonly loading = signal(false);
    readonly loadError = signal(false);

    /** id → unit, for O(1) name resolution (user list/detail/audit). */
    readonly byId = computed(() => {
        const map = new Map<string, OrgUnit>();
        for (const u of this.units()) map.set(u.id, u);
        return map;
    });

    /** Active-only tree — the default source for treeselect pickers. */
    readonly activeTree = computed(() => buildOrgTree(this.units()));

    /** Unit name for an id, or null when unknown/unset. */
    unitName(id: string | null | undefined): string | null {
        return id ? (this.byId().get(id)?.name ?? null) : null;
    }

    /** Loads the flat list once; later calls are no-ops (use refresh() to force). */
    ensureLoaded(): void {
        if (this.loaded() || this.loading()) return;
        this.refresh();
    }

    /** (Re)fetches the flat list and updates the store. */
    refresh(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.http.get<OrgUnit[]>(this.url(), { context: this.silent }).subscribe({
            next: (units) => {
                this.units.set(units);
                this.loaded.set(true);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.loadError.set(true);
            }
        });
    }

    // ── Reads ────────────────────────────────────────────────────────────────
    getUnit(id: string): Observable<OrgUnit> {
        return this.http.get<OrgUnit>(this.url(`/${id}`), { context: this.silent });
    }

    getSubtree(id: string): Observable<OrgUnit[]> {
        return this.http.get<OrgUnit[]>(this.url(`/${id}/subtree`), { context: this.silent });
    }

    getMembers(id: string, subtree: boolean): Observable<OrgUnitMember[]> {
        const params = new HttpParams().set('subtree', String(subtree));
        return this.http.get<OrgUnitMember[]>(this.url(`/${id}/users`), { params, context: this.silent });
    }

    // ── Writes (ROLE_ADMIN — server-enforced) ────────────────────────────────
    create(input: CreateOrgUnitInput): Observable<OrgUnit> {
        return this.http.post<OrgUnit>(this.url(), input, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }

    update(id: string, patch: UpdateOrgUnitInput): Observable<OrgUnit> {
        return this.http.patch<OrgUnit>(this.url(`/${id}`), patch, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(this.url(`/${id}`), { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
}
