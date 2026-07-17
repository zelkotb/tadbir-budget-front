import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    return auth.whenReady$.pipe(
        map(() => auth.isLoggedIn() ? true : router.createUrlTree(['/auth/login']))
    );
};
