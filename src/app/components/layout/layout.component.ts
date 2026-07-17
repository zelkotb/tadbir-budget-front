import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { AppTopbar } from '@/app/components/topbar/topbar.component';
import { AppSidebar } from '@/app/components/sidebar/sidebar.component';
import { AppFooter } from '@/app/components/footer/footer.component';
import { LayoutService } from '@/app/services/layout.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter],
    template: `
        <div class="layout-wrapper" [ngClass]="containerClass()">
            <app-topbar />

            @if (!isAuthRoute()) {
                <app-sidebar />
            }

            <div class="layout-main-container" [class.layout-no-sidebar]="isAuthRoute()">
                <div class="layout-main" [class.layout-auth-main]="isAuthRoute()">
                    <router-outlet />
                </div>
                @if (!isAuthRoute()) {
                    <app-footer />
                }
            </div>

            <div class="layout-mask"></div>
        </div>
    `
})
export class AppLayout {
    private layoutService = inject(LayoutService);
    private router        = inject(Router);

    /** True whenever the active URL starts with /auth */
    readonly isAuthRoute = toSignal(
        this.router.events.pipe(
            filter((e): e is NavigationEnd => e instanceof NavigationEnd),
            map((e) => e.urlAfterRedirects.startsWith('/auth')),
            startWith(this.router.url.startsWith('/auth'))
        ),
        { initialValue: this.router.url.startsWith('/auth') }
    );

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });

        // Collapse the sidebar whenever the user lands on an auth route
        // so the sidebar margin never deforms the login/signup pages.
        effect(() => {
            if (this.isAuthRoute()) {
                this.layoutService.layoutState.update((s) => ({
                    ...s,
                    staticMenuDesktopInactive: true,
                    overlayMenuActive:         false,
                    mobileMenuActive:          false
                }));
            }
        });
    }

    containerClass = computed(() => {
        const config = this.layoutService.layoutConfig();
        const state  = this.layoutService.layoutState();
        return {
            'layout-overlay':          config.menuMode === 'overlay',
            'layout-static':           config.menuMode === 'static',
            'layout-static-inactive':  state.staticMenuDesktopInactive && config.menuMode === 'static',
            'layout-overlay-active':   state.overlayMenuActive,
            'layout-mobile-active':    state.mobileMenuActive
        };
    });
}
