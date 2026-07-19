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
     * SECURITY — Reactive form validation
     * • uid: required (the username; login is by uid, not email)
     * • password: required only — strength rules are enforced server-side and at
     *   user-creation time; we avoid locking out valid pre-existing passwords.
     */
    form = this.fb.group({
        uid: ['', [Validators.required]],
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
         * SECURITY — trim() prevents whitespace-only values from reaching the API.
         * getRawValue() is used instead of .value so disabled controls are included.
         */
        const { uid, password } = this.form.getRawValue();

        this.authService
            .login({ uid: uid!.trim(), password: password! })
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
    get uidCtrl() { return this.form.get('uid')!; }
    get passwordCtrl() { return this.form.get('password')!; }
}

