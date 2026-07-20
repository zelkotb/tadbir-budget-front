import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AvatarModule } from 'primeng/avatar';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutService } from '@/app/services/layout.service';
import { LanguageService } from '@/app/services/language.service';
import { AuthService } from '@/app/pages/auth/auth.service';
import { languages } from '@/app/configuration/language.config';
import { IS_ADMIN } from '@/app/constants/roles';
import { NotificationsComponent } from '@/app/components/notifications/notifications.component';

/**
 * Picsum — deterministic random photo per seed. Seeding by uid keeps the same
 * user's image stable across loads.
 */
function picsumUrl(seedValue: string): string {
    const seed = encodeURIComponent(seedValue.trim().toLowerCase());
    return `https://picsum.photos/seed/${seed}/80`;
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AvatarModule, TranslatePipe, NotificationsComponent],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.scss'
})
export class AppTopbar {
    layoutService   = inject(LayoutService);
    languageService = inject(LanguageService);
    authService     = inject(AuthService);
    private router  = inject(Router);

    languages = languages;

    readonly isLoggedIn  = this.authService.isLoggedIn;
    readonly currentUser = this.authService.currentUser;

    /** Settings is an admin-only control. */
    readonly isAdmin = computed(() => IS_ADMIN(this.currentUser()?.roles ?? []));

    // ── Auto-hide on scroll ───────────────────────────────────────────────────
    /** True → the fixed topbar is slid up out of view (scrolling down). */
    readonly scrolledHidden = signal(false);
    private lastScrollY = 0;

    @HostListener('window:scroll')
    onWindowScroll(): void {
        const y = window.scrollY || document.documentElement.scrollTop;
        const TOPBAR_H = 72;   // stay visible within the first bar-height of the page
        const DELTA = 6;       // ignore tiny scroll jitters

        if (y <= TOPBAR_H) {
            this.scrolledHidden.set(false);
        } else if (y > this.lastScrollY + DELTA) {
            this.scrolledHidden.set(true);    // scrolling down → hide
        } else if (y < this.lastScrollY - DELTA) {
            this.scrolledHidden.set(false);   // scrolling up → show
        }
        this.lastScrollY = y;
    }

    /** True when the side nav is currently open — drives the burger→X morph. */
    readonly menuOpen = computed(() => {
        const cfg = this.layoutService.layoutConfig();
        const st  = this.layoutService.layoutState();
        if (this.layoutService.isDesktop()) {
            return cfg.menuMode === 'overlay' ? st.overlayMenuActive : !st.staticMenuDesktopInactive;
        }
        return st.mobileMenuActive;
    });

    /** Picsum URL — computed synchronously from uid, always consistent. */
    readonly avatarUrl = computed<string | null>(() => {
        const uid = this.currentUser()?.uid;
        return uid ? picsumUrl(uid) : null;
    });

    readonly userInitials = computed<string>(() => {
        const name = this.currentUser()?.fullName ?? '';
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0] ?? '')
            .join('')
            .toUpperCase();
    });

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
