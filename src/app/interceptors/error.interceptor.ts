import {
    HttpContextToken,
    HttpInterceptorFn,
    HttpHandlerFn,
    HttpRequest,
    HttpEvent,
    HttpErrorResponse
} from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';
import { ToastService } from '@/app/services/toast.service';
import { LanguageService } from '@/app/services/language.service';
import { RateLimitService } from '@/app/services/rate-limit.service';
import { getErrorMessage } from '@/app/i18n/error-messages';
import { parseApiError, ApiError } from '@/app/models/api-error.model';

/**
 * When set on a request's HttpContext, the global error interceptor does NOT
 * toast or redirect — it only re-throws with the parsed `apiError` attached.
 * Used by calls whose component performs its own contextual handling (e.g.
 * workflow claim/complete and review submit, which toast AND reload on stale
 * state, and must not be force-redirected to /forbidden on ACCESS_DENIED).
 */
export const SKIP_GLOBAL_ERROR = new HttpContextToken<boolean>(() => false);

/**
 * Global error interceptor — runs *after* the auth interceptor.
 *
 * ToastService and LanguageService are resolved lazily via Injector to break
 * the circular dependency through TranslateHttpLoader → HttpClient.
 * RateLimitService has no HttpClient dependency and is injected eagerly.
 */
export const errorInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const router           = inject(Router);
    const authService      = inject(AuthService);
    const rateLimitService = inject(RateLimitService);
    const injector         = inject(Injector);

    const skipGlobal = req.context.get(SKIP_GLOBAL_ERROR);

    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            const apiError: ApiError | null = parseApiError(err);

            // Component-handled call: attach apiError and bow out (no toast / redirect).
            if (skipGlobal) {
                return throwError(() =>
                    Object.assign(
                        Object.create(Object.getPrototypeOf(err)),
                        err,
                        { apiError: apiError ?? undefined }
                    )
                );
            }

            if (apiError) {
                const toastService    = injector.get(ToastService);
                const languageService = injector.get(LanguageService);
                const lang            = languageService.currentLang().code;

                switch (apiError.code) {

                    // ── Redirects ──────────────────────────────────────────────
                    case 'ACCOUNT_DISABLED':
                        authService.logout();
                        router.navigate(['/auth/account-disabled']);
                        break;

                    case 'ACCESS_DENIED':
                        router.navigate(['/forbidden']);
                        break;

                    // ── Rate limiting (warn toast + countdown) ─────────────────
                    case 'RATE_LIMIT_EXCEEDED': {
                        const retryAfterRaw = err.headers.get('Retry-After');
                        const retryAfter    = retryAfterRaw ? parseInt(retryAfterRaw, 10) : 0;
                        if (retryAfter > 0) rateLimitService.start(retryAfter);
                        toastService.showWarn(getErrorMessage(apiError.code, lang));
                        break;
                    }

                    // ── Refresh-token codes — handled by authInterceptor's retry
                    //    flow; swallow here to avoid duplicate toasts.           ─
                    case 'REFRESH_TOKEN_MISSING':
                    case 'REFRESH_TOKEN_INVALID':
                    case 'REFRESH_TOKEN_REVOKED':
                    case 'REFRESH_TOKEN_EXPIRED':
                        break;

                    // ── VALIDATION_ERROR: field-level — component handles inline ─
                    case 'VALIDATION_ERROR':
                        break;

                    // ── INVALID_CREDENTIALS: component handles inline (login form /
                    //    change-password — expected error shown next to fields)   ─
                    case 'INVALID_CREDENTIALS':
                        break;

                    // ── All other codes → toast at the code's mapped severity ──
                    default:
                        toastService.showApiError(apiError.code);
                        break;
                }
            }

            return throwError(() =>
                Object.assign(
                    Object.create(Object.getPrototypeOf(err)),
                    err,
                    { apiError: apiError ?? undefined }
                )
            );
        })
    );
};
