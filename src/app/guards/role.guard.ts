import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';
import { hasRole } from '@/app/constants/roles';

/**
 * Route guard factory — allows any authenticated user holding at least one of the
 * given authorities. Unknown/empty roles simply fail the check (never throws), so
 * gating on a not-yet-used role is safe.
 *
 * Usage (once the Budget admin screens exist):
 *   canActivate: [roleGuard(Roles.CONTROLE_GESTION)]
 *   canActivate: [roleGuard(Roles.CONTROLE_GESTION, Roles.ADMIN)]  // any of
 */
export const roleGuard = (...required: string[]): CanActivateFn => () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    return auth.whenReady$.pipe(
        map(() => {
            const user = auth.currentUser();
            if (!user)                             return router.createUrlTree(['/auth/login']);
            if (!hasRole(user.roles, ...required)) return router.createUrlTree(['/forbidden']);
            return true;
        })
    );
};
