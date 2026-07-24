import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { AuthService } from '@/app/pages/auth/auth.service';
import { UserService } from '@/app/pages/users/user.service';
import { OrgUnitService } from '@/app/pages/organigramme/org-unit.service';
import { UserSummary } from '@/app/models/user.model';
import { Roles, hasRole, PROJECT_WRITER_ROLES } from '@/app/constants/roles';
import {
    CreateProjectInput,
    Project,
    ProjectListQuery,
    TeamMemberInput,
    UpdateProjectInput
} from '@/app/models/project.model';

const BASE = '/projects';

/**
 * Projects client + signal store. The list (GET /projects) is scoped server-side
 * to what the caller may see; we cache it and filter client-side. Writes are the
 * management hierarchy (except DIRECTION_GENERALE) constrained to the caller's org
 * subtree — mirrored here via {@link canCreate} / {@link canWriteProject} so the UI
 * hides actions the user can't perform (avoids 403s). The server is authoritative.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {
    private http       = inject(HttpClient);
    private auth       = inject(AuthService);
    private userService = inject(UserService);
    private orgService = inject(OrgUnitService);

    private get silent(): HttpContext {
        return new HttpContext().set(SKIP_LOADING, true);
    }
    private url(suffix = ''): string {
        return `${environment.apiUrl}${BASE}${suffix}`;
    }

    // ── List store ───────────────────────────────────────────────────────────
    readonly items     = signal<Project[]>([]);
    readonly loaded    = signal(false);
    readonly loading   = signal(false);
    readonly loadError = signal(false);

    ensureLoaded(): void {
        if (this.loaded() || this.loading()) return;
        this.refresh();
    }

    refresh(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.http.get<Project[]>(this.url(), { context: this.silent }).subscribe({
            next: (items) => { this.items.set(items); this.loaded.set(true); this.loading.set(false); },
            error: () => { this.loading.set(false); this.loadError.set(true); }
        });
    }

    // ── Permission mirror ────────────────────────────────────────────────────
    /** The caller's own profile (org unit + id) — needed for subtree scoping. */
    readonly me = signal<UserSummary | null>(null);
    /** Writable org-unit ids; null once loaded means "all" (ADMIN). */
    readonly writableUnitIds = signal<Set<string> | null>(null);
    /** True once the profile + subtree resolved — gates write-permission checks. */
    readonly meReady = signal(false);
    private meLoaded = false;

    private readonly isAdmin = computed(() => hasRole(this.auth.currentUser()?.roles, Roles.ADMIN));
    /** Holds a role allowed to create/manage projects. */
    readonly isWriterRole = computed(() => hasRole(this.auth.currentUser()?.roles, ...PROJECT_WRITER_ROLES));

    /** Loads the caller's profile + writable subtree once (idempotent). */
    ensureMe(): void {
        if (this.meLoaded) return;
        this.meLoaded = true;
        this.userService.getMe().pipe(catchError(() => of(null))).subscribe((me) => {
            this.me.set(me);
            if (this.isAdmin()) { this.writableUnitIds.set(null); this.meReady.set(true); return; }   // null = all
            if (this.isWriterRole() && me?.orgUnitId) {
                this.orgService.getSubtree(me.orgUnitId).pipe(catchError(() => of([]))).subscribe((units) => {
                    this.writableUnitIds.set(new Set(units.map((u) => u.id)));
                    this.meReady.set(true);
                });
            } else {
                this.writableUnitIds.set(new Set());   // no writable units
                this.meReady.set(true);
            }
        });
    }

    /** May the caller create a project at all (has a writer role + a home unit / admin)? */
    readonly canCreate = computed(() =>
        this.isWriterRole() && (this.isAdmin() || !!this.me()?.orgUnitId)
    );

    /** May the caller edit/manage THIS project (writer role + project's unit in subtree)? */
    canWriteProject(p: Pick<Project, 'orgUnitId'>): boolean {
        if (!this.meReady() || !this.isWriterRole()) return false;
        const ids = this.writableUnitIds();
        return ids === null || ids.has(p.orgUnitId);   // null = admin (all)
    }

    /** May the caller START this project — the chef de projet (any role) OR a manager in scope. */
    canStartProject(p: Pick<Project, 'orgUnitId' | 'chefProjetId'>): boolean {
        if (!this.meReady()) return false;
        const meId = this.me()?.id;
        return (!!meId && meId === p.chefProjetId) || this.canWriteProject(p);
    }

    // ── Reads ────────────────────────────────────────────────────────────────
    list(query: ProjectListQuery = {}): Observable<Project[]> {
        let params = new HttpParams();
        if (query.status)    params = params.set('status',    query.status);
        if (query.orgUnitId) params = params.set('orgUnitId', query.orgUnitId);
        return this.http.get<Project[]>(this.url(), { params, context: this.silent });
    }
    getOne(id: string): Observable<Project> {
        return this.http.get<Project>(this.url(`/${id}`), { context: this.silent });
    }

    // ── Writes ───────────────────────────────────────────────────────────────
    create(input: CreateProjectInput): Observable<Project> {
        return this.http.post<Project>(this.url(), input, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    update(id: string, patch: UpdateProjectInput): Observable<Project> {
        return this.http.patch<Project>(this.url(`/${id}`), patch, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    updateTeam(id: string, team: TeamMemberInput[]): Observable<Project> {
        return this.http.put<Project>(this.url(`/${id}/team`), { team }, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    /** Start a NOT_STARTED project (chef or manager-in-scope); date defaults to today server-side. */
    start(id: string, startDate?: string | null): Observable<Project> {
        return this.http.post<Project>(this.url(`/${id}/start`), startDate ? { startDate } : {}, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    terminate(id: string, year: number): Observable<Project> {
        return this.http.post<Project>(this.url(`/${id}/terminate`), { year }, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    archive(id: string): Observable<Project> {
        return this.http.post<Project>(this.url(`/${id}/archive`), {}, { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
    delete(id: string): Observable<void> {
        return this.http.delete<void>(this.url(`/${id}`), { context: this.silent })
            .pipe(tap(() => this.refresh()));
    }
}
