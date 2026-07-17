import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { minDuration } from '@/app/utils/rxjs.utils';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { Select } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { Card } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { Message } from 'primeng/message';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserService } from '@/app/pages/users/user.service';
import { ToastService } from '@/app/services/toast.service';
import { ArabicKeyboardDirective } from '@/app/components/virtual-keyboard/virtual-keyboard.directive';
import { FieldErrorComponent } from '@/app/components/field-error/field-error.component';
import { CharCounterComponent } from '@/app/components/char-counter/char-counter.component';
import { PasswordStrengthComponent } from '@/app/components/password-strength/password-strength.component';
import { strongPasswordValidator, passwordMatchValidator } from '@/app/utils/validators.utils';
import { ASSIGNABLE_ROLES, roleLabelKey } from '@/app/constants/roles';
import { StatutJuridique, UserSummary, ChangePasswordInput } from '@/app/models/user.model';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        InputMaskModule,
        PasswordModule,
        Select,
        MultiSelectModule,
        Card,
        SkeletonModule,
        Message,
        ArabicKeyboardDirective,
        FieldErrorComponent,
        CharCounterComponent,
        PasswordStrengthComponent,
        TranslatePipe
    ],
    templateUrl: './user-detail.component.html'
})
export class UserDetail implements OnInit {
    private fb           = inject(FormBuilder);
    private userService  = inject(UserService);
    private toastService = inject(ToastService);
    private translate    = inject(TranslateService);
    private router       = inject(Router);
    private route        = inject(ActivatedRoute);

    /** True when this page is reached via /account — the user editing their own profile. */
    readonly isSelfAccount = this.route.snapshot.data['selfAccount'] === true;

    /** For self-account, the id is unknown until `getMe()` resolves. */
    private userId = this.isSelfAccount ? null : this.route.snapshot.paramMap.get('id');

    readonly isEditMode = signal(this.isSelfAccount || (this.userId !== null && this.userId !== 'new'));
    readonly titleKey    = computed(() => {
        if (this.isSelfAccount) return 'users.detail.account_title';
        return this.isEditMode() ? 'users.detail.edit_title' : 'users.detail.create_title';
    });
    readonly subtitleKey = computed(() => {
        if (this.isSelfAccount) return 'users.detail.account_subtitle';
        return this.isEditMode() ? 'users.detail.edit_subtitle' : 'users.detail.create_subtitle';
    });

    readonly statutOptions = [
        { labelKey: 'auth.signup.statut_entreprise',        value: 'ENTREPRISE'        },
        { labelKey: 'auth.signup.statut_personne_physique', value: 'PERSONNE_PHYSIQUE' }
    ];

    // ASSIGNABLE_ROLES is staff-only (never ROLE_USER — citizens self-register).
    readonly roleOptions = ASSIGNABLE_ROLES
        .map((role) => ({ label: this.translate.instant(roleLabelKey(role)), value: role }));

    /** Manager candidates (enabled staff users) + loading flag. */
    readonly managerOptions  = signal<{ label: string; value: string }[]>([]);
    readonly loadingManagers = signal(false);

    readonly MAX = { fullName: 100, cin: 20, phoneNumber: 20, email: 255, address: 255, password: 128 } as const;

    form = this.fb.group(
        {
            fullName:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            cin:             ['', [Validators.required, Validators.pattern(/^[A-Z]{1,2}[0-9]{5,7}$/), Validators.maxLength(20)]],
            phoneNumber:     ['', [Validators.required, Validators.pattern(/^\+212 [5-7](?: \d{2}){4}$/), Validators.maxLength(20)]],
            email:           ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            address:         ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
            statutJuridique: ['', Validators.required],
            roles:           [[] as string[], Validators.required],
            managerId:       [null as string | null],   // optional staff manager
            password:        [''],
            confirmPassword: ['']
        },
        { validators: passwordMatchValidator() }
    );

    loading      = signal(false);
    loadingUser = signal(false);
    fieldErrors = signal<Record<string, string>>({});

    passwordForm = this.fb.group(
        {
            currentPassword: [''],
            password:        ['', [Validators.required, strongPasswordValidator()]],
            confirmPassword: ['', Validators.required]
        },
        { validators: passwordMatchValidator() }
    );

    changingPassword     = signal(false);
    passwordChangeErrorKey = signal('');

    constructor() {
        if (!this.isEditMode()) {
            this.passwordCtrl.addValidators([Validators.required, strongPasswordValidator()]);
            this.confirmPasswordCtrl.addValidators([Validators.required]);
        }
        // Backend requires the current password only when users change their own — not when an admin resets another user's.
        if (this.isSelfAccount) {
            this.currentPasswordCtrl.addValidators([Validators.required]);
        }
    }

    ngOnInit(): void {
        // Manager assignment is an admin concern — not shown on the self-account page.
        if (!this.isSelfAccount) this.loadManagers();

        if (this.isSelfAccount) {
            this.loadingUser.set(true);
            this.userService.getMe().pipe(
                minDuration(400),
                catchError(() => {
                    this.loadingUser.set(false);
                    this.toastService.showError(this.translate.instant('users.detail.load_error'));
                    this.router.navigate(['/account']);
                    return EMPTY;
                })
            ).subscribe((user) => {
                this.userId = user.id;
                this.loadingUser.set(false);
                this.patchForm(user);
            });
        } else if (this.isEditMode() && this.userId) {
            this.loadingUser.set(true);
            this.userService.getUser(this.userId).pipe(
                minDuration(400),
                catchError(() => {
                    this.loadingUser.set(false);
                    this.toastService.showError(this.translate.instant('users.detail.load_error'));
                    this.router.navigate(['/users']);
                    return EMPTY;
                })
            ).subscribe((user) => {
                this.loadingUser.set(false);
                this.patchForm(user);
            });
        }
    }

    /** Manager (N+1) candidates from GET /user/staff (citizens excluded), minus the edited user. */
    private loadManagers(): void {
        this.loadingManagers.set(true);
        this.userService.getStaff().pipe(
            catchError(() => of<UserSummary[]>([]))
        ).subscribe((staff) => {
            this.managerOptions.set(
                (staff ?? [])
                    .filter((u) => u.id !== this.userId)
                    .map((u) => ({ label: `${u.fullName} — ${u.email}`, value: u.id }))
            );
            this.loadingManagers.set(false);
        });
    }

    private patchForm(user: UserSummary): void {
        this.form.patchValue({
            fullName:        user.fullName,
            cin:             user.cin,
            phoneNumber:     user.phoneNumber,
            email:           user.email,
            address:         user.address,
            statutJuridique: user.statutJuridique,
            roles:           user.roles,
            managerId:       user.managerId ?? null
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.fieldErrors.set({});

        const raw = this.form.getRawValue();
        const base = {
            fullName:        raw.fullName!.trim(),
            cin:             raw.cin!.trim().toUpperCase(),
            phoneNumber:     raw.phoneNumber!.trim(),
            email:           raw.email!.trim().toLowerCase(),
            address:         raw.address!.trim(),
            statutJuridique: raw.statutJuridique as StatutJuridique,
            roles:           raw.roles ?? []
        };
        // Manager is an admin-only field — never send it from the self-account page.
        const payload = this.isSelfAccount ? base : { ...base, managerId: raw.managerId || null };

        const request$ = this.isEditMode() && this.userId
            ? this.userService.updateUser(this.userId, payload)
            : this.userService.createUser({ ...payload, password: raw.password! });

        request$.subscribe({
            next: () => {
                this.loading.set(false);
                this.toastService.showSuccess(this.translate.instant(
                    this.isEditMode() ? 'users.detail.update_success' : 'users.detail.create_success'
                ));
                this.router.navigate([this.isSelfAccount ? '/account' : '/users']);
            },
            error: (err) => {
                this.loading.set(false);
                if (err?.apiError?.code === 'VALIDATION_ERROR') {
                    this.fieldErrors.set(err.apiError.fieldErrors ?? {});
                }
                // All other codes handled as toasts by the global error interceptor.
            }
        });
    }

    onChangePassword(): void {
        if (this.passwordForm.invalid || !this.userId) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.changingPassword.set(true);
        this.passwordChangeErrorKey.set('');

        const raw = this.passwordForm.getRawValue();
        const input: ChangePasswordInput = { newPassword: raw.password! };
        if (this.isSelfAccount) input.currentPassword = raw.currentPassword!;

        this.userService.changePassword(this.userId, input).subscribe({
            next: () => {
                this.changingPassword.set(false);
                this.toastService.showSuccess(this.translate.instant('users.detail.change_password_success'));
                this.passwordForm.reset();
            },
            error: (err) => {
                this.changingPassword.set(false);
                this.passwordChangeErrorKey.set(
                    err?.apiError?.code === 'INVALID_CREDENTIALS'
                        ? 'users.detail.change_password_invalid_current'
                        : 'users.detail.error_generic'
                );
            }
        });
    }

    cancel(): void {
        this.router.navigate([this.isSelfAccount ? '/account' : '/users']);
    }

    get fullNameCtrl()        { return this.form.get('fullName')!; }
    get cinCtrl()             { return this.form.get('cin')!; }
    get phoneCtrl()           { return this.form.get('phoneNumber')!; }
    get emailCtrl()           { return this.form.get('email')!; }
    get addressCtrl()         { return this.form.get('address')!; }
    get statutCtrl()          { return this.form.get('statutJuridique')!; }
    get rolesCtrl()           { return this.form.get('roles')!; }
    get managerCtrl()         { return this.form.get('managerId')!; }
    get passwordCtrl()        { return this.form.get('password')!; }
    get confirmPasswordCtrl() { return this.form.get('confirmPassword')!; }

    get currentPasswordCtrl()    { return this.passwordForm.get('currentPassword')!; }
    get newPasswordCtrl()        { return this.passwordForm.get('password')!; }
    get confirmNewPasswordCtrl() { return this.passwordForm.get('confirmPassword')!; }
}
