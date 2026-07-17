import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';
import { IS_STAFF } from '@/app/constants/roles';

/**
 * Requires an authenticated user holding any "staff" role (anyone other than the
 * citizen ROLE_USER — instructor, validator, commission, admin) — the instruction
 * work-queue and the staff-side request detail.
 */
export const staffGuard: CanActivateFn = () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    return auth.whenReady$.pipe(
        map(() => {
            const user = auth.currentUser();
            if (!user)                  return router.createUrlTree(['/auth/login']);
            if (!IS_STAFF(user.roles))  return router.createUrlTree(['/forbidden']);
            return true;
        })
    );
};
