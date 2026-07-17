import { Routes } from '@angular/router';

export default [
    { path: '',    loadComponent: () => import('./user-list/user-list.component').then((m) => m.UserList) },
    { path: 'new', loadComponent: () => import('./user-detail/user-detail.component').then((m) => m.UserDetail) },
    { path: ':id', loadComponent: () => import('./user-detail/user-detail.component').then((m) => m.UserDetail) }
] as Routes;
