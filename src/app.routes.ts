import { Routes } from '@angular/router';
import { AppLayout } from '@/app/components/layout/layout.component';
import { Notfound } from '@/app/pages/not-found/not-found.component';
import { Forbidden } from '@/app/pages/forbidden/forbidden.component';
import { authGuard } from '@/app/guards/auth.guard';
import { guestGuard } from '@/app/guards/guest.guard';
import { adminGuard } from '@/app/guards/admin.guard';

export { DEFAULT_ROUTE } from '@/app/app.constants';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: 'auth',
                canActivate: [guestGuard],
                loadChildren: () => import('@/app/pages/auth/auth.routes')
            },
            {
                path: 'account',
                canActivate: [authGuard],
                data: { selfAccount: true },
                loadComponent: () =>
                    import('@/app/pages/users/user-detail/user-detail.component').then((m) => m.UserDetail)
            },
            {
                path: 'audit',
                canActivate: [adminGuard],
                loadChildren: () => import('@/app/pages/audit/audit.routes')
            },
            {
                path: 'users',
                canActivate: [adminGuard],
                loadChildren: () => import('@/app/pages/users/users.routes')
            },
            // No landing page — the app opens on the login screen. Guests land on
            // /auth/login; guestGuard bounces already-authenticated users to their home.
            { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
        ]
    },
    { path: 'forbidden', component: Forbidden },
    { path: 'notfound',  component: Notfound  },
    {
        // Public legal page — full CGU + data protection (Loi 09-08 / CNDP). No guard.
        path: 'cgu',
        loadComponent: () => import('@/app/pages/legal/cgu.component').then((m) => m.Cgu)
    },
    { path: '**',        redirectTo: '/notfound' }
];
