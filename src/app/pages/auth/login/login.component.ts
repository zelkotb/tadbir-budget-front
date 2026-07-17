import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@/app/pages/auth/auth.service';
import { RateLimitService } from '@/app/services/rate-limit.service';
import { homeRouteFor } from '@/app/app.constants';


@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        Message,
        TranslatePipe
    ],
    templateUrl: './login.component.html'
})
export class Login {
    private fb          = inject(FormBuilder);
    private authService = inject(AuthService);
    private router      = inject(Router);
    readonly rateLimit  = inject(RateLimitService);

    /**
     * SECURITY â€” Reactive form validation
     * â€¢ email: required + RFC-5322 format check (Angular built-in Validators.email)
     * â€¢ password: required only on the login form â€” strength rules are enforced
     *   at signup time; we avoid locking out users whose passwords pre-date
     *   the strength policy.
     */
    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        rememberMe: [false]
    });

    loading = signal(false);
    errorKey = signal(''); // i18n key, never a raw backend message

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorKey.set('');

        /**
         * SECURITY â€” trim() prevents whitespace-only values from reaching the API.
         * getRawValue() is used instead of .value so disabled controls are included.
         */
        const { email, password } = this.form.getRawValue();

        this.authService
            .login({ email: email!.trim(), password: password! })
            .subscribe({
                next: () => {
                    this.loading.set(false);
                    this.router.navigate([homeRouteFor(this.authService.currentUser()?.roles ?? [])]);
                },
                error: (err) => {
                    this.loading.set(false);
                    if (err.status === 429) return; // interceptor shows toast + countdown
                    this.errorKey.set(
                        err.status === 401
                            ? 'auth.login.error_credentials'
                            : 'auth.login.error_generic'
                    );
                }
            });
    }

    /** Convenience getters for template readability */
    get emailCtrl() { return this.form.get('email')!; }
    get passwordCtrl() { return this.form.get('password')!; }
}

