import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from '@/app/components/menu-item/menu-item.component';
import { AuthService } from '@/app/pages/auth/auth.service';
import { SettingsService } from '@/app/services/settings.service';
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
    private auth     = inject(AuthService);
    private settings = inject(SettingsService);

    // The projects nav label follows the global terminology (Projets / Programmes);
    // the value is the already-translated word, so menu-item's translate pipe is a no-op.
    readonly model = computed<AppMenuSection[]>(() => {
        const userRoles = this.auth.currentUser()?.roles ?? [];
        const projectsLabel = this.settings.terms().plural_cap;

        const sections: AppMenuSection[] = [
            {
                label: 'menu.general',
                items: [
                    { label: 'menu.account',      icon: 'pi pi-user',      routerLink: ['/account'],      path: '/account'      },
                    { label: 'menu.organigramme', icon: 'pi pi-sitemap',   routerLink: ['/organigramme'], path: '/organigramme' },
                    { label: projectsLabel,       icon: 'pi pi-briefcase', routerLink: ['/projects'],     path: '/projects'     }
                ]
            },
            {
                label: 'menu.budget',
                items: [
                    { label: 'menu.tree_types',    icon: 'pi pi-list',    routerLink: ['/tree-types'],    path: '/tree-types'    },
                    { label: 'menu.nomenclatures', icon: 'pi pi-sitemap', routerLink: ['/nomenclatures'], path: '/nomenclatures' }
                ]
            },
            {
                label: 'menu.admin',
                roles: [Roles.ADMIN],
                items: [
                    { label: 'menu.users',       icon: 'pi pi-users',     routerLink: ['/users'],       path: '/users'       },
                    { label: 'menu.parametrage', icon: 'pi pi-sliders-h', routerLink: ['/parametrage'], path: '/parametrage' },
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
        ];

        return sections.filter((section) =>
            (!section.roles || section.roles.some((r) => userRoles.includes(r))) &&
            (!section.gate || section.gate(userRoles))
        );
    });
}
