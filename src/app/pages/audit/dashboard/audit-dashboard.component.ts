import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-audit-dashboard',
    standalone: true,
    imports: [TranslatePipe],
    template: `
        <div class="bg-surface-0 border border-surface rounded-2xl shadow-sm
                    flex flex-col items-center justify-center py-24 gap-4">
            <i class="pi pi-chart-bar text-5xl text-muted-color"></i>
            <p class="text-muted-color text-base m-0">{{ 'audit.logs.tab_other_soon' | translate }}</p>
        </div>
    `
})
export class AuditDashboard {}
