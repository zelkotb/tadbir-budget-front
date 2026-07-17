import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';
import { IS_ADMIN } from '@/app/constants/roles';

export const adminGuard: CanActivateFn = () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    return auth.whenReady$.pipe(
        map(() => {
            const user = auth.currentUser();
            if (!user)                      return router.createUrlTree(['/auth/login']);
            if (!IS_ADMIN(user.roles))      return router.createUrlTree(['/forbidden']);
            return true;
        })
    );
};
