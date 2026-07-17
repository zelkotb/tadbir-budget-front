import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '@/app/services/loading.service';

/** Set this token to true on a request to skip the global loading overlay. */
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.context.get(SKIP_LOADING)) {
        return next(req);
    }

    const loading = inject(LoadingService);
    loading.increment();
    return next(req).pipe(finalize(() => loading.decrement()));
};
