import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import {
    CreateAssignmentInput,
    CreateNomenclatureInput,
    CreateRubriqueInput,
    Nomenclature,
    Rubrique,
    RubriqueAssignment,
    UpdateNomenclatureInput,
    UpdateRubriqueInput
} from '@/app/models/nomenclature.model';

const BASE = '/budget/nomenclatures';

/**
 * Nomenclatures client + signal store for the list. Rubriques are fetched per
 * nomenclature by the builder (not globally cached). Every list-level mutation
 * refetches the list. Reads open to all; writes are admin / contrôle-de-gestion
 * and valid while status !== ARCHIVED (FIXED stays editable — server-enforced).
 */
@Injectable({ providedIn: 'root' })
export class NomenclatureService {
    private http = inject(HttpClient);

    private get silent(): HttpContext {
        return new HttpContext().set(SKIP_LOADING, true);
    }
    private url(suffix = ''): string {
        return `${environment.apiUrl}${BASE}${suffix}`;
    }

    // ── List store ───────────────────────────────────────────────────────────
    readonly items     = signal<Nomenclature[]>([]);
    readonly loaded    = signal(false);
    readonly loading   = signal(false);
    readonly loadError = signal(false);

    readonly byId = computed(() => {
        const map = new Map<string, Nomenclature>();
        for (const n of this.items()) map.set(n.id, n);
        return map;
    });

    ensureLoaded(): void {
        if (this.loaded() || this.loading()) return;
        this.refresh();
    }

    refresh(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.http.get<Nomenclature[]>(this.url(), { context: this.silent }).subscribe({
            next: (items) => {
                this.items.set(items);
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
    getOne(id: string): Observable<Nomenclature> {
        return this.http.get<Nomenclature>(this.url(`/${id}`), { context: this.silent });
    }
    getRubriques(id: string): Observable<Rubrique[]> {
        return this.http.get<Rubrique[]>(this.url(`/${id}/rubriques`), { context: this.silent });
    }

    // ── Nomenclature writes (admin / CdG — server-enforced) ──────────────────
    create(input: CreateNomenclatureInput): Observable<Nomenclature> {
        return this.http.post<Nomenclature>(this.url(), input, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    update(id: string, patch: UpdateNomenclatureInput): Observable<Nomenclature> {
        return this.http.patch<Nomenclature>(this.url(`/${id}`), patch, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    fix(id: string): Observable<Nomenclature> {
        return this.http.post<Nomenclature>(this.url(`/${id}/fix`), {}, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    archive(id: string): Observable<Nomenclature> {
        return this.http.post<Nomenclature>(this.url(`/${id}/archive`), {}, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    delete(id: string): Observable<void> {
        return this.http.delete<void>(this.url(`/${id}`), { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }

    // ── Versioning ────────────────────────────────────────────────────────────
    /** Clone a FIXED nomenclature into a new DRAFT of the same lineage. */
    clone(id: string, copyAssignments: boolean): Observable<Nomenclature> {
        const params = new HttpParams().set('copyAssignments', String(copyAssignments));
        return this.http.post<Nomenclature>(this.url(`/${id}/clone`), {}, { params, context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    /** All versions of the lineage this nomenclature belongs to (oldest → newest). */
    getVersions(id: string): Observable<Nomenclature[]> {
        return this.http.get<Nomenclature[]>(this.url(`/${id}/versions`), { context: this.silent });
    }

    // ── Rubrique writes (DRAFT or FIXED — not ARCHIVED) ───────────────────────
    createRubrique(nomenclatureId: string, input: CreateRubriqueInput): Observable<Rubrique> {
        return this.http.post<Rubrique>(this.url(`/${nomenclatureId}/rubriques`), input, { context: this.silent });
    }
    updateRubrique(nomenclatureId: string, rubriqueId: string, patch: UpdateRubriqueInput): Observable<Rubrique> {
        return this.http.patch<Rubrique>(this.url(`/${nomenclatureId}/rubriques/${rubriqueId}`), patch, { context: this.silent });
    }
    deleteRubrique(nomenclatureId: string, rubriqueId: string): Observable<void> {
        return this.http.delete<void>(this.url(`/${nomenclatureId}/rubriques/${rubriqueId}`), { context: this.silent });
    }

    // ── Assignments (admin / CdG — FIXED nomenclature) ───────────────────────
    getAssignments(nomenclatureId: string, orgUnitId?: string): Observable<RubriqueAssignment[]> {
        let params = new HttpParams();
        if (orgUnitId) params = params.set('orgUnitId', orgUnitId);
        return this.http.get<RubriqueAssignment[]>(this.url(`/${nomenclatureId}/assignments`), { params, context: this.silent });
    }
    createAssignment(nomenclatureId: string, input: CreateAssignmentInput): Observable<RubriqueAssignment> {
        return this.http.post<RubriqueAssignment>(this.url(`/${nomenclatureId}/assignments`), input, { context: this.silent });
    }
    deleteAssignment(nomenclatureId: string, assignmentId: string): Observable<void> {
        return this.http.delete<void>(this.url(`/${nomenclatureId}/assignments/${assignmentId}`), { context: this.silent });
    }

    /**
     * Rubriques the caller (or, for admins, the given org unit) may attach — the
     * assigned nodes plus their whole subtrees. Read-only, any authenticated user.
     */
    getUsableRubriques(nomenclatureId: string, orgUnitId?: string): Observable<Rubrique[]> {
        let params = new HttpParams();
        if (orgUnitId) params = params.set('orgUnitId', orgUnitId);
        return this.http.get<Rubrique[]>(this.url(`/${nomenclatureId}/usable-rubriques`), { params, context: this.silent });
    }
}
