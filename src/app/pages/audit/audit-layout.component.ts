import { Component, inject, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';

@Component({
    selector: 'app-audit-layout',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [RouterModule, TranslatePipe, BackButtonComponent],
    styleUrl: './audit-layout.component.scss',
    template: `
        <div class="p-6 audit-shell">
            <div class="audit-header">
                <app-back-button />
                <div>
                    <h2 class="audit-title m-0">{{ 'audit.title' | translate }}</h2>
                    <p class="audit-subtitle m-0">{{ 'audit.subtitle' | translate }}</p>
                </div>
            </div>

            <div class="audit-card">
                <div class="audit-tabs">
                    <button type="button" class="audit-tab" [class.active]="activeTab() === 'logs'"
                            (click)="onTabChange('logs')">
                        <i class="pi pi-shield"></i><span>{{ 'audit.logs.tab_auth' | translate }}</span>
                    </button>
                    <button type="button" class="audit-tab" [class.active]="activeTab() === 'user-audit'"
                            (click)="onTabChange('user-audit')">
                        <i class="pi pi-users"></i><span>{{ 'audit.user.tab_label' | translate }}</span>
                    </button>
                    <button type="button" class="audit-tab" [class.active]="activeTab() === 'other'"
                            (click)="onTabChange('other')">
                        <i class="pi pi-list"></i><span>{{ 'audit.logs.tab_other' | translate }}</span>
                    </button>
                </div>
                <router-outlet />
            </div>
        </div>
    `
})
export class AuditLayout {
    private router = inject(Router);

    readonly activeTab = toSignal(
        this.router.events.pipe(
            filter((e): e is NavigationEnd => e instanceof NavigationEnd),
            map(() => this.tabFromUrl()),
            startWith(this.tabFromUrl())
        ),
        { initialValue: this.tabFromUrl() }
    );

    onTabChange(value: string | number | undefined): void {
        if (value) this.router.navigate(['/audit', value]);
    }

    private tabFromUrl(): string {
        const path = this.router.url.split('?')[0];
        if (path.endsWith('/other'))      return 'other';
        if (path.endsWith('/user-audit')) return 'user-audit';
        return 'logs';
    }
}
