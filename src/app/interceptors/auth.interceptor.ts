import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
    HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';
import { parseApiError, REFRESH_TOKEN_CODES } from '@/app/models/api-error.model';
import { AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH, AUTH_REFRESH_PATH } from '@/app/pages/auth/auth.paths';

/**
 * SECURITY — What this interceptor does
 * ──────────────────────────────────────
 *
 * 1. Bearer token injection
 *    Reads the in-memory JWT from AuthService and attaches it as
 *    "Authorization: Bearer <token>" on every outgoing request.
 *    The HttpRequest is immutable; we clone it before adding the header.
 *
 * 2. Selective silent token refresh on 401 / 403
 *    A 401 or 403 only triggers a refresh when the backend error code belongs to
 *    the REFRESH_TOKEN_* family (missing / invalid / revoked / expired) OR when
 *    there is no parseable error body — e.g. an expired access token rejected by
 *    the security filter, which returns a bare 403 before the app's exception
 *    handler runs.
 *    Errors with a real app code (INVALID_CREDENTIALS, ACCESS_DENIED, …) are
 *    re-thrown unchanged so the calling component / error interceptor can handle them.
 *
 * 3. Concurrent-401 deduplication
 *    If several requests fail with 401 simultaneously, the refresh is only
 *    fired once (handled inside AuthService via BehaviorSubject queuing).
 *    All queued requests receive the new token and are retried together.
 *
 * 4. Logout on refresh failure
 *    If /auth/refresh itself returns 401/403, the session is cleared and the
 *    user is redirected to /auth/login.
 *
 * 5. Skip refresh for auth endpoints
 *    /auth/login, /auth/refresh, and /auth/logout are excluded from the retry
 *    loop to avoid infinite recursion.
 */
export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    const authReq = attachToken(req, authService.getToken());

    return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
            if ((err.status === 401 || err.status === 403) && !isAuthUrl(req.url)) {
                const apiError = parseApiError(err);

                // Only refresh when the error is about the *token itself*, or when
                // the body could not be parsed (security-filter 401/403 raised
                // before the app's exception handler, e.g. an expired access token).
                // Real app errors (ACCESS_DENIED, INVALID_CREDENTIALS, …) carry a
                // code and fall through untouched.
                const shouldRefresh = !apiError || REFRESH_TOKEN_CODES.has(apiError.code);

                if (shouldRefresh) {
                    return authService.refreshAccessToken().pipe(
                        switchMap((newToken) => next(attachToken(req, newToken))),
                        catchError((refreshErr) => {
                            // Refresh token is also expired/revoked → hard logout
                            authService.logout();
                            router.navigate(['/auth/login']);
                            return throwError(() => refreshErr);
                        })
                    );
                }
                // INVALID_CREDENTIALS, USER_NOT_FOUND, etc. → fall through
            }

            return throwError(() => err);
        })
    );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function attachToken(
    req: HttpRequest<unknown>,
    token: string | null
): HttpRequest<unknown> {
    // withCredentials so the HttpOnly refresh-token cookie is sent on every call
    // (required by the backend; harmless same-origin behind the nginx /api proxy).
    return req.clone({
        withCredentials: true,
        setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
    });
}

/** Returns true for endpoints that must NOT trigger a token-refresh attempt. */
function isAuthUrl(url: string): boolean {
    return (
        url.includes(AUTH_LOGIN_PATH)   ||
        url.includes(AUTH_REFRESH_PATH) ||
        url.includes(AUTH_LOGOUT_PATH)
    );
}
