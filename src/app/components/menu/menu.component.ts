import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from '@/app/components/menu-item/menu-item.component';
import { AuthService } from '@/app/pages/auth/auth.service';
import { Roles } from '@/app/constants/roles';

/** PrimeNG MenuItem extended with an optional role-gate. */
interface AppMenuSection extends MenuItem {
    roles?: string[];
    /** Predicate gate (generic) — used instead of a fixed `roles` list. */
    gate?: (roles: string[]) => boolean;
    items?: AppMenuSection[];
}

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem],
    template: `
        <ul class="layout-menu">
            @for (item of model(); track item.label) {
                @if (!item.separator) {
                    <li app-menuitem [item]="item" [root]="true"></li>
                } @else {
                    <li class="menu-separator"></li>
                }
            }
        </ul>
    `
})
export class AppMenu {
    private auth = inject(AuthService);

    private readonly fullModel: AppMenuSection[] = [
        {
            label: 'menu.general',
            items: [
                { label: 'menu.account',      icon: 'pi pi-user',    routerLink: ['/account'],      path: '/account'      },
                { label: 'menu.organigramme', icon: 'pi pi-sitemap', routerLink: ['/organigramme'], path: '/organigramme' }
            ]
        },
        {
            label: 'menu.config',
            items: [
                { label: 'menu.tree_types', icon: 'pi pi-list', routerLink: ['/tree-types'], path: '/tree-types' }
            ]
        },
        {
            label: 'menu.admin',
            roles: [Roles.ADMIN],
            items: [
                { label: 'menu.users', icon: 'pi pi-users', routerLink: ['/users'], path: '/users' },
                {
                    label: 'menu.audit',
                    icon: 'pi pi-history',
                    path: '/audit',
                    items: [
                        { label: 'menu.audit_logs',      icon: 'pi pi-list',      routerLink: ['/audit/logs'],      path: '/audit/logs'      },
                        { label: 'menu.audit_dashboard', icon: 'pi pi-chart-bar', routerLink: ['/audit/dashboard'], path: '/audit/dashboard' }
                    ]
                }
            ]
        }
        // ── RESERVED: Budget administration (ROLE_CONTROLE_GESTION) ──────────────
        // Foundation for the upcoming nomenclature / campaigns / freeze-validate
        // screens. Uncomment once those routes exist and guard them with
        // roleGuard(Roles.CONTROLE_GESTION). Gate the section with the matching
        // predicate so it only appears for holders of the role:
        //
        //   import { IS_CONTROLE_GESTION } from '@/app/constants/roles';
        //
        //   {
        //       label: 'menu.budget_admin',
        //       gate: IS_CONTROLE_GESTION,
        //       items: [
        //           { label: 'menu.budget_nomenclature', icon: 'pi pi-sitemap',  routerLink: ['/budget/nomenclature'], path: '/budget/nomenclature' },
        //           { label: 'menu.budget_campaigns',    icon: 'pi pi-calendar', routerLink: ['/budget/campaigns'],    path: '/budget/campaigns'    }
        //       ]
        //   }
    ];

    readonly model = computed(() => {
        const userRoles = this.auth.currentUser()?.roles ?? [];
        return this.fullModel.filter((section) =>
            (!section.roles || section.roles.some((r) => userRoles.includes(r))) &&
            (!section.gate || section.gate(userRoles))
        );
    });
}
