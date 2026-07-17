import { Component, inject, ViewEncapsulation } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';
import { LoadingService } from '@/app/services/loading.service';

@Component({
    selector: 'app-loading-overlay',
    standalone: true,
    imports: [ProgressSpinner],
    encapsulation: ViewEncapsulation.None,
    styles: [`
        .loading-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(2px);
            animation: loading-fade-in 150ms ease forwards;
        }

        @keyframes loading-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
        }

        .loading-overlay .p-progressspinner {
            width: 6rem !important;
            height: 6rem !important;
        }
    `],
    template: `
        @if (loading.isLoading()) {
            <div class="loading-overlay">
                <p-progress-spinner strokeWidth="4" animationDuration=".8s" />
            </div>
        }
    `
})
export class LoadingOverlay {
    readonly loading = inject(LoadingService);
}
