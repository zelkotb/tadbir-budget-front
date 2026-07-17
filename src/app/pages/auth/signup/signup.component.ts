import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { Select } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@/app/pages/auth/auth.service';
import { RateLimitService } from '@/app/services/rate-limit.service';
import { homeRouteFor } from '@/app/app.constants';
import { ArabicKeyboardDirective } from '@/app/components/virtual-keyboard/virtual-keyboard.directive';
import { FieldErrorComponent } from '@/app/components/field-error/field-error.component';
import { CharCounterComponent } from '@/app/components/char-counter/char-counter.component';
import { PasswordStrengthComponent } from '@/app/components/password-strength/password-strength.component';
import { strongPasswordValidator, passwordMatchValidator } from '@/app/utils/validators.utils';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        InputMaskModule,
        PasswordModule,
        Select,
        CheckboxModule,
        ArabicKeyboardDirective,
        FieldErrorComponent,
        CharCounterComponent,
        PasswordStrengthComponent,
        TranslatePipe
    ],
    templateUrl: './signup.component.html'
})
export class Signup {
    private fb            = inject(FormBuilder);
    private authService   = inject(AuthService);
    private router        = inject(Router);
    readonly rateLimit    = inject(RateLimitService);

    /**
     * Statut juridique options labels are i18n keys resolved at render time
     * via the `translate` pipe inside the <p-select> ng-template, so they
     * update automatically when the user switches language.
     */
    statutOptions = [
        { labelKey: 'auth.signup.statut_entreprise',       value: 'ENTREPRISE'        },
        { labelKey: 'auth.signup.statut_personne_physique', value: 'PERSONNE_PHYSIQUE' }
    ];

    /**
     * SECURITY Reactive form with field-level validators:
     *
     * fullName     : required, min 3 chars
     * cin          : required, Moroccan CIN pattern (1-2 uppercase letters + 5-7 digits)
     * phoneNumber  : required, Moroccan phone format via input mask (+212 6 12 34 56 78)
     * email        : required + RFC-5322 format
     * adresse      : required, min 10 chars
     * statutJuridique: required
     * password     : required + strength policy (upper, lower, digit, special)
     * confirmPassword: required + cross-field match (group-level validator)
     */
    readonly MAX = { fullName: 100, cin: 20, phoneNumber: 20, email: 255, adresse: 255, password: 128 } as const;

    form = this.fb.group(
        {
            fullName:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            cin:             ['', [Validators.required, Validators.pattern(/^[A-Z]{1,2}[0-9]{5,7}$/), Validators.maxLength(20)]],
            phoneNumber:     ['', [Validators.required, Validators.pattern(/^\+212 [5-7](?: \d{2}){4}$/), Validators.maxLength(20)]],
            email:           ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            adresse:         ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
            statutJuridique: ['', Validators.required],
            password:        ['', [Validators.required, strongPasswordValidator()]],
            confirmPassword: ['', Validators.required],
            // Mandatory CGU / data-protection (CNDP) consent. Gates submission only —
            // intentionally NOT included in the signup payload (handled server-side later).
            acceptTerms:     [false, Validators.requiredTrue]
        },
        { validators: passwordMatchValidator() }
    );

    loading     = signal(false);
    fieldErrors = signal<Record<string, string>>({});

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.fieldErrors.set({});

        const raw = this.form.getRawValue();

        this.authService
            .signup({
                fullName:        raw.fullName!.trim(),
                cin:             raw.cin!.trim().toUpperCase(),
                phoneNumber:     raw.phoneNumber!.trim(),
                email:           raw.email!.trim().toLowerCase(),
                adresse:         raw.adresse!.trim(),
                statutJuridique: raw.statutJuridique as 'ENTREPRISE' | 'PERSONNE_PHYSIQUE',
                password:        raw.password!
            })
            .subscribe({
                next: () => {
                    this.loading.set(false);
                    this.router.navigate([homeRouteFor(this.authService.currentUser()?.roles ?? [])]);
                },
                error: (err) => {
                    this.loading.set(false);
                    // VALIDATION_ERROR → map field errors; all other codes are
                    // handled as toasts by the global error interceptor.
                    if (err?.apiError?.code === 'VALIDATION_ERROR') {
                        this.fieldErrors.set(err.apiError.fieldErrors ?? {});
                    }
                }
            });
    }

    get fullNameCtrl()        { return this.form.get('fullName')!; }
    get cinCtrl()             { return this.form.get('cin')!; }
    get phoneCtrl()           { return this.form.get('phoneNumber')!; }
    get emailCtrl()           { return this.form.get('email')!; }
    get adresseCtrl()         { return this.form.get('adresse')!; }
    get statutCtrl()          { return this.form.get('statutJuridique')!; }
    get passwordCtrl()        { return this.form.get('password')!; }
    get confirmPasswordCtrl() { return this.form.get('confirmPassword')!; }
    get acceptTermsCtrl()     { return this.form.get('acceptTerms')!; }
}

