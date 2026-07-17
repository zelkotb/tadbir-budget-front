import { Injectable, signal, computed, effect } from '@angular/core';
import { updatePreset } from '@primeuix/themes';
import { LayoutConfig, defaultLayoutConfig, buildPrimaryScale, buildSurfaceScale } from '@/app/configuration/layout.config';

export type { LayoutConfig } from '@/app/configuration/layout.config';

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    layoutConfig = signal<LayoutConfig>(defaultLayoutConfig);

    layoutState = signal<LayoutState>({
        staticMenuDesktopInactive: true,
        overlayMenuActive: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);
    isOverlay       = computed(() => this.layoutConfig().menuMode === 'overlay');

    constructor() {
        effect(() => {
            const config  = this.layoutConfig();
            const surface = buildSurfaceScale(config.surface);
            updatePreset({
                semantic: {
                    primary: buildPrimaryScale(config.primary),
                    ...(surface ? {
                        colorScheme: {
                            light: { surface },
                            dark:  { surface }
                        }
                    } : {})
                }
            });
        });
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !prev.overlayMenuActive }));
        }
        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !prev.staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !prev.mobileMenuActive }));
        }
    }

    isDesktop(): boolean {
        return window.innerWidth > 991;
    }
}
