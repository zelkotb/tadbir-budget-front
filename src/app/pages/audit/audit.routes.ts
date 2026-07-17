import { Routes } from '@angular/router';
import { AuditLayout } from './audit-layout.component';

export default [
    {
        path: '',
        component: AuditLayout,
        children: [
            { path: '',           redirectTo: 'logs', pathMatch: 'full' },
            { path: 'logs',       loadComponent: () => import('./logs/audit-logs.component').then((m) => m.AuditLogs)            },
            { path: 'user-audit', loadComponent: () => import('./user-audit/user-audit-logs.component').then((m) => m.UserAuditLogs) },
            { path: 'other',      loadComponent: () => import('./other/audit-other.component').then((m) => m.AuditOther)          }
        ]
    },
    { path: 'dashboard', loadComponent: () => import('./dashboard/audit-dashboard.component').then((m) => m.AuditDashboard) },
    { path: 'user-audit/:revisionId', loadComponent: () => import('./user-audit/user-audit-detail.component').then((m) => m.UserAuditDetail) }
] as Routes;
