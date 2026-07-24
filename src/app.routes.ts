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
                // Company chart — readable by every authenticated user; admin
                // actions inside the page are gated on the JWT roles claim.
                path: 'organigramme',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/organigramme/organigramme.component').then((m) => m.Organigramme)
            },
            {
                // Budget tree-type templates — reference data, readable by all;
                // write actions inside gated on ADMIN / CONTROLE_GESTION.
                path: 'tree-types',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/tree-types/tree-types.component').then((m) => m.TreeTypes)
            },
            {
                // Nomenclatures — real trees built from a definition. Readable by all;
                // building/fixing gated on ADMIN / CONTROLE_GESTION and DRAFT status.
                path: 'nomenclatures',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/nomenclatures/nomenclatures.component').then((m) => m.Nomenclatures)
            },
            {
                path: 'nomenclatures/:id',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/nomenclatures/nomenclature-builder.component').then((m) => m.NomenclatureBuilder)
            },
            {
                // Projects & programmes — visible to any authenticated user (the list
                // is scoped server-side); create/manage gated inside on role + subtree.
                path: 'projects',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/projects/projects.component').then((m) => m.Projects)
            },
            {
                // Dedicated routed create/edit form (replaces the inline dialogs).
                path: 'projets/nouveau',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/projects/project-form.component').then((m) => m.ProjectForm)
            },
            {
                path: 'projets/:id/modifier',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/projects/project-form.component').then((m) => m.ProjectForm)
            },
            {
                path: 'projects/:id',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('@/app/pages/projects/project-detail.component').then((m) => m.ProjectDetail)
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
            {
                // Paramétrage — admin settings (terminology, …).
                path: 'parametrage',
                canActivate: [adminGuard],
                loadComponent: () =>
                    import('@/app/pages/parametrage/parametrage.component').then((m) => m.Parametrage)
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
