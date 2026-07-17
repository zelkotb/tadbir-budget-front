import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Toast, ToastPositionType } from 'primeng/toast';
import { VirtualKeyboardComponent } from '@/app/components/virtual-keyboard/virtual-keyboard.component';
import { LoadingOverlay } from '@/app/components/loading-overlay/loading-overlay.component';
import { LanguageService } from '@/app/services/language.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, VirtualKeyboardComponent, Toast, LoadingOverlay],
    template: `
        <router-outlet />
        <p-toast [position]="toastPosition()" [life]="5000" />
        <app-virtual-keyboard />
        <app-loading-overlay />
    `
})
export class AppComponent {
    private languageService = inject(LanguageService);

    /**
     * RTL (Arabic) → 'top-left'  (= the start/primary corner in a right-to-left layout)
     * LTR (French) → 'top-right' (conventional notification corner)
     */
    readonly toastPosition = computed<ToastPositionType>(() =>
        this.languageService.currentLang().direction === 'rtl' ? 'top-left' : 'top-right'
    );
}
