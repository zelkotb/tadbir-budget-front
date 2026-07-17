import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';
import { Roles } from '@/app/constants/roles';

/** Requires an authenticated user holding ROLE_USER (the citizen role). */
export const userGuard: CanActivateFn = () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    return auth.whenReady$.pipe(
        map(() => {
            const user = auth.currentUser();
            if (!user)                              return router.createUrlTree(['/auth/login']);
            if (!user.roles.includes(Roles.USER))   return router.createUrlTree(['/forbidden']);
            return true;
        })
    );
};
