import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { minDuration } from '@/app/utils/rxjs.utils';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TreeSelectModule } from 'primeng/treeselect';
import { SkeletonModule } from 'primeng/skeleton';
import { Message } from 'primeng/message';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserService } from '@/app/pages/users/user.service';
import { ToastService } from '@/app/services/toast.service';
import { OrgUnitService } from '@/app/pages/organigramme/org-unit.service';
import { OrgUnit, findNodeById } from '@/app/models/org-unit.model';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { ArabicKeyboardDirective } from '@/app/components/virtual-keyboard/virtual-keyboard.directive';
import { FieldErrorComponent } from '@/app/components/field-error/field-error.component';
import { CharCounterComponent } from '@/app/components/char-counter/char-counter.component';
import { PasswordStrengthComponent } from '@/app/components/password-strength/password-strength.component';
import { strongPasswordValidator, passwordMatchValidator } from '@/app/utils/validators.utils';
import { ASSIGNABLE_ROLES, roleLabelKey } from '@/app/constants/roles';
import { UserSummary, ChangePasswordInput, CreateUserInput, UpdateUserInput } from '@/app/models/user.model';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        Select,
        MultiSelectModule,
        TreeSelectModule,
        SkeletonModule,
        Message,
        ArabicKeyboardDirective,
        FieldErrorComponent,
        CharCounterComponent,
        PasswordStrengthComponent,
        TranslatePipe,
        BackButtonComponent
    ],
    templateUrl: './user-detail.component.html',
    styleUrl: './user-detail.component.scss'
})
export class UserDetail implements OnInit {
    private fb           = inject(FormBuilder);
    private userService  = inject(UserService);
    readonly orgService  = inject(OrgUnitService);
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
    /** Card 1 heading — "Informations personnelles" on the account page, else "Informations du compte". */
    readonly card1TitleKey = computed(() =>
        this.isSelfAccount ? 'users.detail.card_personal_title' : 'users.detail.card_account_title'
    );

    readonly roleOptions = ASSIGNABLE_ROLES
        .map((role) => ({ label: this.translate.instant(roleLabelKey(role)), value: role }));

    /** Manager (N+1) candidates + loading flag. */
    readonly managerOptions  = signal<{ label: string; value: string }[]>([]);
    readonly loadingManagers = signal(false);

    readonly MAX = { fullName: 100, uid: 50, phoneNumber: 20, email: 255, password: 128 } as const;

    form = this.fb.group(
        {
            uid:             ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/), Validators.minLength(3), Validators.maxLength(50)]],
            fullName:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            phoneNumber:     ['', [Validators.maxLength(20)]],   // optional (label reads "(optionnel)")
            email:           ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            roles:           [[] as string[], Validators.required],
            managerId:       [null as string | null],            // optional hierarchy manager
            orgUnit:         [null as TreeNode<OrgUnit> | null], // optional org unit (p-treeselect binds nodes)
            password:        [''],
            confirmPassword: ['']
        },
        { validators: passwordMatchValidator() }
    );

    /** orgUnitId waiting for the org tree to load before the node can be selected. */
    private readonly pendingOrgUnitId = signal<string | null>(null);

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
        } else {
            // Admin form: an org unit is required (self-account never sees this field).
            this.orgUnitCtrl.addValidators(Validators.required);
            this.orgUnitCtrl.updateValueAndValidity();
        }

        // Select the user's org-unit node once the tree is available (load order
        // of user vs. org-units is not deterministic).
        effect(() => {
            const id = this.pendingOrgUnitId();
            if (!id || !this.orgService.loaded()) return;
            const node = findNodeById(this.orgService.activeTree(), id);
            if (node) this.form.patchValue({ orgUnit: node });
            this.pendingOrgUnitId.set(null);
        });
    }

    ngOnInit(): void {
        // Manager + org-unit assignment are admin concerns — not shown on the self-account page.
        if (!this.isSelfAccount) {
            this.loadManagers();
            this.orgService.ensureLoaded();
        }

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

    /** Manager (N+1) candidates from GET /user/staff, minus the edited user. */
    private loadManagers(): void {
        this.loadingManagers.set(true);
        this.userService.getStaff().pipe(
            catchError(() => of<UserSummary[]>([]))
        ).subscribe((staff) => {
            this.managerOptions.set(
                (staff ?? [])
                    .filter((u) => u.id !== this.userId)
                    .map((u) => ({ label: `${u.fullName} — ${u.uid}`, value: u.id }))
            );
            this.loadingManagers.set(false);
        });
    }

    private patchForm(user: UserSummary): void {
        this.form.patchValue({
            uid:         user.uid,
            fullName:    user.fullName,
            phoneNumber: user.phoneNumber,
            email:       user.email,
            roles:       user.roles,
            managerId:   user.managerId ?? null
        });
        this.pendingOrgUnitId.set(user.orgUnitId ?? null);
    }

    /** Scroll to the first invalid field of a form (group-level errors → last field). */
    private scrollToInvalid(group: FormGroup, order: string[], prefix: string): void {
        const first = order.find((f) => group.get(f)?.invalid)
            ?? (group.errors ? order[order.length - 1] : null);
        if (first) document.getElementById(prefix + first)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.scrollToInvalid(
                this.form as FormGroup,
                ['fullName', 'uid', 'phoneNumber', 'email', 'roles', 'orgUnit', 'password', 'confirmPassword'],
                'accf-'
            );
            return;
        }

        this.loading.set(true);
        this.fieldErrors.set({});

        const raw = this.form.getRawValue();

        const request$ = this.isEditMode() && this.userId
            ? this.userService.updateUser(this.userId, this.buildUpdate(raw))
            : this.userService.createUser(this.buildCreate(raw));

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

    private buildCreate(raw: ReturnType<typeof this.form.getRawValue>): CreateUserInput {
        return {
            uid:         raw.uid!.trim(),
            fullName:    raw.fullName!.trim(),
            phoneNumber: raw.phoneNumber!.trim(),
            email:       raw.email!.trim().toLowerCase(),
            password:    raw.password!,
            roles:       raw.roles ?? [],
            managerId:   raw.managerId || null,
            orgUnitId:   raw.orgUnit?.data?.id ?? null
        };
    }

    private buildUpdate(raw: ReturnType<typeof this.form.getRawValue>): UpdateUserInput {
        const base: UpdateUserInput = {
            uid:         raw.uid!.trim(),
            fullName:    raw.fullName!.trim(),
            phoneNumber: raw.phoneNumber!.trim(),
            email:       raw.email!.trim().toLowerCase()
        };
        // roles / managerId / orgUnitId are admin-only — never sent from the
        // self-account page (server ignores them on self-update anyway).
        return this.isSelfAccount
            ? base
            : {
                ...base,
                roles:     raw.roles ?? [],
                managerId: raw.managerId || null,
                orgUnitId: raw.orgUnit?.data?.id ?? null
            };
    }

    onChangePassword(): void {
        if (this.passwordForm.invalid || !this.userId) {
            this.passwordForm.markAllAsTouched();
            this.scrollToInvalid(this.passwordForm as FormGroup, ['currentPassword', 'password', 'confirmPassword'], 'accp-');
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

    get uidCtrl()             { return this.form.get('uid')!; }
    get fullNameCtrl()        { return this.form.get('fullName')!; }
    get phoneCtrl()           { return this.form.get('phoneNumber')!; }
    get emailCtrl()           { return this.form.get('email')!; }
    get rolesCtrl()           { return this.form.get('roles')!; }
    get managerCtrl()         { return this.form.get('managerId')!; }
    get orgUnitCtrl()         { return this.form.get('orgUnit')!; }
    get passwordCtrl()        { return this.form.get('password')!; }
    get confirmPasswordCtrl() { return this.form.get('confirmPassword')!; }

    get currentPasswordCtrl()    { return this.passwordForm.get('currentPassword')!; }
    get newPasswordCtrl()        { return this.passwordForm.get('password')!; }
    get confirmNewPasswordCtrl() { return this.passwordForm.get('confirmPassword')!; }
}
