import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { AuthService } from '@/app/pages/auth/auth.service';
import { LanguageService } from '@/app/services/language.service';
import { AppSetting, ProjectTerminology, TERMINOLOGY_KEY, TermSet } from '@/app/models/settings.model';

const BASE = '/settings';

/**
 * Application settings + the single source of truth for the projects-feature
 * vocabulary. `project.terminology` (PROJECT | PROGRAM) decides whether the whole
 * feature reads "projet(s)" or "programme(s)"; {@link terms} exposes the four term
 * forms as translate() params, reactive to both the setting and the UI language.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
    private http      = inject(HttpClient);
    private auth      = inject(AuthService);
    private translate = inject(TranslateService);
    private lang      = inject(LanguageService);

    private get silent(): HttpContext { return new HttpContext().set(SKIP_LOADING, true); }
    private url(suffix = ''): string { return `${environment.apiUrl}${BASE}${suffix}`; }

    readonly settings = signal<AppSetting[]>([]);
    readonly loaded   = signal(false);
    readonly loading  = signal(false);
    readonly loadError = signal(false);

    /** Resolved terminology; defaults to PROJECT until settings load. */
    readonly terminology = computed<ProjectTerminology>(() =>
        this.settings().find((s) => s.key === TERMINOLOGY_KEY)?.value === 'PROGRAM' ? 'PROGRAM' : 'PROJECT'
    );

    /** Term forms for translate() params — reactive to terminology AND language. */
    readonly terms = computed<TermSet>(() => {
        this.lang.currentLang();   // dependency: recompute on language change
        const base = this.terminology() === 'PROGRAM' ? 'terms.program' : 'terms.project';
        return {
            singular:     this.translate.instant(`${base}.singular`),
            singular_cap: this.translate.instant(`${base}.singular_cap`),
            plural:       this.translate.instant(`${base}.plural`),
            plural_cap:   this.translate.instant(`${base}.plural_cap`)
        };
    });

    constructor() {
        // Settings require authentication — (re)load whenever a session becomes active.
        effect(() => {
            if (this.auth.isLoggedIn()) {
                if (!this.loaded() && !this.loading()) this.load();
            } else {
                this.loaded.set(false);
                this.settings.set([]);
            }
        });
    }

    load(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.http.get<AppSetting[]>(this.url(), { context: this.silent }).subscribe({
            next: (list) => { this.settings.set(list); this.loaded.set(true); this.loading.set(false); },
            error: () => { this.loading.set(false); this.loadError.set(true); }
        });
    }

    getOne(key: string): Observable<AppSetting> {
        return this.http.get<AppSetting>(this.url(`/${key}`), { context: this.silent });
    }

    /** PUT a setting (ROLE_ADMIN); patches the local store on success. */
    update(key: string, value: string): Observable<AppSetting> {
        return this.http.put<AppSetting>(this.url(`/${key}`), { value }, { context: this.silent }).pipe(
            tap((saved) => this.settings.update((list) => {
                const next = list.filter((s) => s.key !== key);
                next.push(saved);
                return next;
            }))
        );
    }
}
