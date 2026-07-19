import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, ReplaySubject, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH, AUTH_REFRESH_PATH } from './auth.paths';

const skipLoading = { context: new HttpContext().set(SKIP_LOADING, true) };

// ─── Models ───────────────────────────────────────────────────────────────────

/** Login is by `uid` (username), NOT email. */
export interface LoginInput {
    uid: string;
    password: string;
}

/** Returned by login and refresh — JWT only; user data is decoded from the token. */
export interface RefreshOutput {
    jwt: string;
}

// ─── Internal session state (memory-only, never persisted to localStorage) ───

interface SessionState {
    token:    string;
    roles:    string[];
    fullName: string;
    uid:      string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);

    /**
     * SECURITY — JWT storage strategy
     * ─────────────────────────────────
     * The access JWT lives exclusively in a private Angular signal (memory).
     * It is NEVER written to localStorage / sessionStorage, which eliminates
     * the classic XSS token-theft vector.
     *
     * Persistence across page refreshes is handled by the REFRESH TOKEN:
     * the backend sets an HttpOnly + Secure + SameSite=Strict cookie that the
     * browser attaches automatically on every call to /auth/refresh.
     * Angular code never reads or writes that cookie — it is opaque to JS.
     */
    private _session = signal<SessionState | null>(null);

    // ── Session-ready gate ────────────────────────────────────────────────────
    // Guards subscribe to whenReady$ and wait for one emission before reading
    // isLoggedIn(). ReplaySubject(1) replays the single emission to late subscribers,
    // so a guard that arrives after tryRestoreSession() completes is unblocked instantly.
    private readonly _ready$  = new ReplaySubject<void>(1);
    readonly         whenReady$ = this._ready$.asObservable();

    // ── Concurrent-refresh guard ──────────────────────────────────────────────
    // Only ONE /auth/refresh is in flight at a time. Concurrent 401s all subscribe
    // to the SAME shared observable, so every waiter receives the new token on
    // success — or the SAME error on failure (never an infinite wait).
    private _refresh$: Observable<string> | null = null;

    // ── Public read-only state ────────────────────────────────────────────────

    readonly isLoggedIn  = computed(() => this._session() !== null);
    readonly currentUser = computed(() => this._session());

    // ── Auth API ──────────────────────────────────────────────────────────────

    login(input: LoginInput): Observable<RefreshOutput> {
        return this.http
            .post<RefreshOutput>(`${environment.apiUrl}${AUTH_LOGIN_PATH}`, input, { withCredentials: true, ...skipLoading })
            .pipe(tap((res) => this._applyJwt(res.jwt)));
    }

    logout(): void {
        this.http
            .post(`${environment.apiUrl}${AUTH_LOGOUT_PATH}`, {}, { withCredentials: true, ...skipLoading })
            .subscribe({ error: () => {} });
        this._session.set(null);
    }

    getToken(): string | null {
        return this._session()?.token ?? null;
    }

    // ── Token refresh ─────────────────────────────────────────────────────────

    refreshAccessToken(): Observable<string> {
        // A refresh is already in flight → share it (all waiters get the same
        // success token or the same error; no waiter is ever left hanging).
        if (this._refresh$) return this._refresh$;

        this._refresh$ = this.http
            .post<RefreshOutput>(
                `${environment.apiUrl}${AUTH_REFRESH_PATH}`,
                {},
                { withCredentials: true, ...skipLoading }
            )
            .pipe(
                tap((res) => this._applyJwt(res.jwt)),
                map((res) => res.jwt),
                catchError((err) => {
                    this._session.set(null);
                    return throwError(() => err);
                }),
                // Clear the cached call once it settles so the next 401 can retry.
                finalize(() => { this._refresh$ = null; }),
                shareReplay({ bufferSize: 1, refCount: false })
            );

        return this._refresh$;
    }

    // ── Session restoration (APP_INITIALIZER) ─────────────────────────────────

    /**
     * Called before the first navigation. Tries to restore the session from the
     * HttpOnly refresh-token cookie. Never rejects — a missing/expired cookie
     * simply leaves the session null (guest state).
     */
    async tryRestoreSession(): Promise<void> {
        try {
            await firstValueFrom(
                this.refreshAccessToken().pipe(catchError(() => of(null)))
            );
        } finally {
            this._ready$.next();
            this._ready$.complete();
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Decodes the JWT payload and stores the session.
     * Called after every successful auth response (login, refresh).
     *
     * JWT claims:
     *   sub      → uid (username)
     *   fullName → display name
     *   roles    → string[] (e.g. ["ROLE_ADMIN"])
     */
    private _applyJwt(token: string): void {
        try {
            const payload = token.split('.')[1];
            const claims  = JSON.parse(this._b64UrlToUtf8(payload));
            this._session.set({
                token,
                uid:      claims.sub      ?? '',
                fullName: claims.fullName ?? '',
                roles:    claims.roles    ?? []
            });
        } catch {
            this._session.set(null);
        }
    }

    /**
     * Decode a base64url JWT segment as UTF-8. `atob` yields a binary (Latin-1)
     * string, so non-ASCII claims (e.g. "Représentant Commission") come out as
     * mojibake ("ReprÃ©sentant…"); re-decode the raw bytes through TextDecoder.
     */
    private _b64UrlToUtf8(segment: string): string {
        const bytes = Uint8Array.from(
            atob(segment.replace(/-/g, '+').replace(/_/g, '/')),
            (c) => c.charCodeAt(0)
        );
        return new TextDecoder('utf-8').decode(bytes);
    }
}
