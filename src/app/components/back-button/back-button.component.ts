import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Reusable "return" button — the 44px translucent rounded-square arrow placed
 * next to a page title (the Organigramme style, used app-wide). Navigates to the
 * previous history entry.
 */
@Component({
    selector: 'app-back-button',
    standalone: true,
    imports: [ButtonModule, TranslatePipe],
    template: `
        <p-button
            icon="pi pi-arrow-left"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [attr.aria-label]="'common.back' | translate"
            (onClick)="back()"
        />
    `,
    styles: [`
        :host ::ng-deep .p-button {
            width: 44px;
            height: 44px;
            border: none;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.6);
            color: #334155;
        }
        :host ::ng-deep .p-button:hover {
            background: rgba(255, 255, 255, 0.9);
            color: #334155;
        }
        :host ::ng-deep .p-button .p-button-icon { font-size: 20px; }
    `]
})
export class BackButtonComponent {
    private location = inject(Location);

    back(): void {
        this.location.back();
    }
}
