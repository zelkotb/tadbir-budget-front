import { Component, inject, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { Tabs, Tab, TabList } from 'primeng/tabs';
import { Card } from 'primeng/card';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-audit-layout',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [RouterModule, Tabs, Tab, TabList, Card, TranslatePipe],
    styles: [`
        .audit-tab-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.6rem;
            height: 1.6rem;
            border-radius: 50%;
            background-color: var(--p-primary-color);
            color: #fff;
            flex-shrink: 0;

            i { font-size: 0.7rem; }
        }
    `],
    template: `
        <div class="p-6">
            <div class="mb-5">
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">
                    {{ 'audit.title' | translate }}
                </h2>
                <p class="text-muted-color mt-1 mb-0">{{ 'audit.subtitle' | translate }}</p>
            </div>
            <p-card class="overflow-hidden">
                <ng-template #content>
                    <p-tabs [value]="activeTab()" (valueChange)="onTabChange($event)">
                        <p-tablist>
                            <p-tab value="logs">
                                <span class="flex items-center gap-2">
                                    <span class="audit-tab-icon"><i class="pi pi-shield"></i></span>
                                    {{ 'audit.logs.tab_auth' | translate }}
                                </span>
                            </p-tab>
                            <p-tab value="user-audit">
                                <span class="flex items-center gap-2">
                                    <span class="audit-tab-icon"><i class="pi pi-users"></i></span>
                                    {{ 'audit.user.tab_label' | translate }}
                                </span>
                            </p-tab>
                            <p-tab value="other">
                                <span class="flex items-center gap-2">
                                    <span class="audit-tab-icon"><i class="pi pi-list"></i></span>
                                    {{ 'audit.logs.tab_other' | translate }}
                                </span>
                            </p-tab>
                        </p-tablist>
                    </p-tabs>
                    <router-outlet />
                </ng-template>
            </p-card>
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
