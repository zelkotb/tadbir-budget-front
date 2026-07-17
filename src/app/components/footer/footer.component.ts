import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [TranslatePipe],
    template: `
        <div class="layout-footer">
            <img src="/assets/img/maroc-logo.png" alt="Tadbir Budget" class="h-6 w-auto mr-2" />
            <span class="font-semibold">Tadbir Budget</span>
            <span class="mx-2">|</span>
            <span>&copy; {{ currentYear }} Zakaria El Kotb. {{ 'footer.rights' | translate }}</span>
        </div>
    `
})
export class AppFooter {
    currentYear = new Date().getFullYear();
}