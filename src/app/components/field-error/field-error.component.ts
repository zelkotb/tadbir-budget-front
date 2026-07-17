import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LanguageService } from '@/app/services/language.service';
import { getErrorMessage } from '@/app/i18n/error-messages';

/**
 * Displays a translated API error beneath a single form field.
 *
 * Usage:
 *   <app-field-error fieldName="email" [fieldErrors]="apiErrors" [control]="form.get('email')" />
 *
 * - fieldErrors: raw code map from the backend  { email: 'INVALID_EMAIL' }
 * - control:     when provided, the error auto-hides as soon as the user types
 *
 * Implementation note — why signal inputs instead of @Input():
 *   In zoneless mode, the message computed must read fieldErrors() as a tracked
 *   signal dependency so it re-evaluates whenever the parent pushes new errors.
 *   Decorator @Input() + ngOnChanges + _dismissed.set(false) fails because
 *   Angular skips the signal notification when the value is already false.
 */
@Component({
    selector: 'app-field-error',
    standalone: true,
    templateUrl: './field-error.component.html'
})
export class FieldErrorComponent implements OnDestroy {

    readonly fieldName   = input.required<string>();
    readonly fieldErrors = input<Record<string, string>>({});
    readonly control     = input<AbstractControl | null>(null);

    private readonly lang     = inject(LanguageService);
    private readonly _hidden  = signal(false);
    private _sub?: Subscription;

    readonly message = computed<string | null>(() => {
        if (this._hidden()) return null;
        const code = this.fieldErrors()[this.fieldName()];
        if (!code) return null;
        return getErrorMessage(code, this.lang.currentLang().code);
    });

    constructor() {
        // Un-hide whenever new errors arrive (fieldErrors reference changes)
        effect(() => {
            this.fieldErrors();            // tracked dependency
            this._hidden.set(false);       // reveal for this new batch
        });

        // Re-subscribe to the control so typing hides the error
        effect(() => {
            this._sub?.unsubscribe();
            const ctrl = this.control();
            if (ctrl) {
                this._sub = ctrl.valueChanges.subscribe(() => this._hidden.set(true));
            }
        });
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }
}
