import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AvatarModule } from 'primeng/avatar';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutService } from '@/app/services/layout.service';
import { LanguageService } from '@/app/services/language.service';
import { AuthService } from '@/app/pages/auth/auth.service';
import { languages } from '@/app/configuration/language.config';
import { NotificationsComponent } from '@/app/components/notifications/notifications.component';

/**
 * DiceBear — open source, deterministic professional avatars.
 * Same email always produces the same avatar (seed-based, no async needed).
 * Style "notionists": clean illustrated portraits.
 */
function dicebearUrl(email: string): string {
    const seed = encodeURIComponent(email.trim().toLowerCase());
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
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

    /** DiceBear URL — computed synchronously from email, always consistent. */
    readonly avatarUrl = computed<string | null>(() => {
        const email = this.currentUser()?.email;
        return email ? dicebearUrl(email) : null;
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
