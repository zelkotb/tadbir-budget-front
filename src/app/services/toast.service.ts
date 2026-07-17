import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LanguageService } from '@/app/services/language.service';
import { getErrorMessage, getErrorSeverity } from '@/app/i18n/error-messages';

/**
 * Thin wrapper around PrimeNG's {@link MessageService}.
 *
 * Responsibilities:
 * - Enforces a consistent 5-second auto-dismiss lifetime.
 * - Resolves localised summary labels (Erreur / خطأ, etc.) from the active language.
 * - All toasts appear at `top-right`.  In RTL (Arabic) the browser positions
 *   fixed elements from the start side (right), so toasts land at the correct
 *   visual corner without any extra work.
 *
 * Usage:
 * ```ts
 * toastService.showError('Something went wrong');
 * toastService.showSuccess('Profile updated.');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ToastService {

    private messageService  = inject(MessageService);
    private languageService = inject(LanguageService);

    private readonly LIFE_MS = 5_000;

    // ── Public API ────────────────────────────────────────────────────────────

    showError(detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary:  this.label('error'),
            detail,
            life:     this.LIFE_MS
        });
    }

    showSuccess(detail: string): void {
        this.messageService.add({
            severity: 'success',
            summary:  this.label('success'),
            detail,
            life:     this.LIFE_MS
        });
    }

    showInfo(detail: string): void {
        this.messageService.add({
            severity: 'info',
            summary:  this.label('info'),
            detail,
            life:     this.LIFE_MS
        });
    }

    showWarn(detail: string): void {
        this.messageService.add({
            severity: 'warn',
            summary:  this.label('warn'),
            detail,
            life:     this.LIFE_MS
        });
    }

    /**
     * Surfaces a backend API error code as a toast, resolving both the localized
     * message and the appropriate severity from the central error dictionary.
     * Single source of truth shared by the error interceptor and feature
     * components that handle their own errors (e.g. workflow actions).
     */
    showApiError(code: string): void {
        const lang     = this.languageService.currentLang().code;
        const message  = getErrorMessage(code, lang);
        switch (getErrorSeverity(code)) {
            case 'warn': this.showWarn(message); break;
            case 'info': this.showInfo(message); break;
            default:     this.showError(message); break;
        }
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private label(type: 'error' | 'success' | 'info' | 'warn'): string {
        const lang = this.languageService.currentLang().code;
        const labels: Record<string, Record<typeof type, string>> = {
            ar: { error: 'خطأ',   success: 'نجاح',    info: 'معلومة',      warn: 'تحذير'          },
            fr: { error: 'Erreur', success: 'Succès',  info: 'Information', warn: 'Avertissement'  }
        };
        return (labels[lang] ?? labels['fr'])[type];
    }
}
