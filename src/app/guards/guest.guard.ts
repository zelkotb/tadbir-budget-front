import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '@/app/pages/auth/auth.service';
import { homeRouteFor } from '@/app/app.constants';

export const guestGuard: CanActivateFn = () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    return auth.whenReady$.pipe(
        map(() => auth.isLoggedIn()
            ? router.createUrlTree([homeRouteFor(auth.currentUser()?.roles ?? [])])
            : true)
    );
};
