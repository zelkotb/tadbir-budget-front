import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { CreateTreeTypeInput, TreeType, UpdateTreeTypeInput } from '@/app/models/tree-type.model';

const BASE = '/budget/nomenclature-definitions';

/**
 * Budget tree-types client + signal store.
 *
 * The list (GET /budget/nomenclature-definitions, each with its levels) is cached in a signal;
 * `byId` is computed for name resolution. Every mutation refetches the list so
 * the table — and the upcoming Nomenclature picker — stay in sync. Reads are open
 * to all authenticated users; writes are admin / contrôle-de-gestion (server-enforced).
 */
@Injectable({ providedIn: 'root' })
export class TreeTypeService {
    private http = inject(HttpClient);

    private get silent(): HttpContext {
        return new HttpContext().set(SKIP_LOADING, true);
    }
    private url(suffix = ''): string {
        return `${environment.apiUrl}${BASE}${suffix}`;
    }

    // ── Store ────────────────────────────────────────────────────────────────
    readonly types     = signal<TreeType[]>([]);
    readonly loaded    = signal(false);
    readonly loading   = signal(false);
    readonly loadError = signal(false);

    readonly byId = computed(() => {
        const map = new Map<string, TreeType>();
        for (const t of this.types()) map.set(t.id, t);
        return map;
    });

    /** Active types only — the default source for a picker. */
    readonly activeTypes = computed(() => this.types().filter((t) => t.active));

    ensureLoaded(): void {
        if (this.loaded() || this.loading()) return;
        this.refresh();
    }

    refresh(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.http.get<TreeType[]>(this.url(), { context: this.silent }).subscribe({
            next: (types) => {
                this.types.set(types);
                this.loaded.set(true);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.loadError.set(true);
            }
        });
    }

    getOne(id: string): Observable<TreeType> {
        return this.http.get<TreeType>(this.url(`/${id}`), { context: this.silent });
    }

    // ── Writes (ROLE_ADMIN | ROLE_CONTROLE_GESTION — server-enforced) ─────────
    create(input: CreateTreeTypeInput): Observable<TreeType> {
        return this.http.post<TreeType>(this.url(), input, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }

    update(id: string, patch: UpdateTreeTypeInput): Observable<TreeType> {
        return this.http.patch<TreeType>(this.url(`/${id}`), patch, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(this.url(`/${id}`), { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
}
