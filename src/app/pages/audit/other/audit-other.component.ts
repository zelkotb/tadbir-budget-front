import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-audit-other',
    standalone: true,
    imports: [TranslatePipe],
    template: `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <i class="pi pi-list text-5xl text-muted-color"></i>
            <p class="text-muted-color text-base m-0">{{ 'audit.logs.tab_other_soon' | translate }}</p>
        </div>
    `
})
export class AuditOther {}
