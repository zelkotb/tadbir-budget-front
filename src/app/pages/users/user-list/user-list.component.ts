import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subject, Subscription, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { minDuration } from '@/app/utils/rxjs.utils';
import { ConfirmationService } from 'primeng/api';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Popover, PopoverModule } from 'primeng/popover';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Card } from 'primeng/card';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserService } from '@/app/pages/users/user.service';
import { UserSummary, StatutJuridique, UserListQuery } from '@/app/models/user.model';
import { AuthService } from '@/app/pages/auth/auth.service';
import { ToastService } from '@/app/services/toast.service';
import { ALL_ROLES, roleLabelKey } from '@/app/constants/roles';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        FormsModule,
        Card,
        TableModule,
        TagModule,
        ButtonModule,
        SkeletonModule,
        TooltipModule,
        SelectModule,
        MultiSelectModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        PopoverModule,
        ConfirmPopupModule,
        TranslatePipe
    ],
    providers: [ConfirmationService],
    templateUrl: './user-list.component.html'
})
export class UserList implements OnInit, OnDestroy {
    private userService    = inject(UserService);
    private authService    = inject(AuthService);
    private toastService   = inject(ToastService);
    private confirmService = inject(ConfirmationService);
    private translate      = inject(TranslateService);
    private router         = inject(Router);

    // ── Table state ────────────────────────────────────────────────────────────
    readonly users        = signal<UserSummary[]>([]);
    readonly loading      = signal(true);
    readonly totalRecords = signal(0);
    readonly activeUser   = signal<UserSummary | null>(null);
    readonly actionLoading = signal<string | null>(null);

    currentPage = 0;
    rowsPerPage = 10;
    first       = 0;

    // ── Filter state (applied on submit only) ──────────────────────────────────
    filterFullName = '';
    filterEmail    = '';
    filterCin      = '';
    filterStatut:  StatutJuridique | null = null;
    filterEnabled: boolean | null = null;
    filterRoles:   string[] = [];

    private appliedFilters: Partial<UserListQuery> = {};

    // ── Static options ─────────────────────────────────────────────────────────
    readonly statutOptions: { labelKey: string; value: StatutJuridique }[] = [
        { labelKey: 'auth.signup.statut_entreprise',        value: 'ENTREPRISE'        },
        { labelKey: 'auth.signup.statut_personne_physique', value: 'PERSONNE_PHYSIQUE' }
    ];

    readonly enabledOptions = [
        { labelKey: 'users.filter_active',   value: true  },
        { labelKey: 'users.filter_disabled', value: false }
    ];

    readonly roleOptions = ALL_ROLES.map((role) => ({ label: this.translate.instant(roleLabelKey(role)), value: role }));

    // PrimeNG's TableBody renders `loadingBodyTemplate` (which we don't define) instead of
    // our `#body` template whenever `rowData` is falsy — so placeholders must be truthy.
    readonly skeletonRows = Array(10).fill(true);

    // ── Streams ────────────────────────────────────────────────────────────────
    private readonly reload$ = new Subject<void>();
    private readonly _subs   = new Subscription();

    // ── Computed ───────────────────────────────────────────────────────────────
    get myEmail(): string { return this.authService.currentUser()?.email ?? ''; }

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this._subs.add(
            this.reload$.pipe(
                switchMap(() => {
                    this.loading.set(true);
                    return this.userService.getUsers(this.buildQuery()).pipe(
                        catchError(() => of(null)),
                        minDuration(400)
                    );
                })
            ).subscribe(page => {
                if (page) {
                    this.users.set(page.content);
                    this.totalRecords.set(page.totalElements);
                }
                this.loading.set(false);
            })
        );
        this.reload$.next();
    }

    ngOnDestroy(): void { this._subs.unsubscribe(); }

    // ── Filter handlers ────────────────────────────────────────────────────────
    applyFilters(): void {
        this.appliedFilters = {
            fullName:        this.filterFullName || undefined,
            email:           this.filterEmail    || undefined,
            cin:             this.filterCin      || undefined,
            statutJuridique: this.filterStatut   ?? undefined,
            enabled:         this.filterEnabled  ?? undefined,
            roles:           this.filterRoles.length ? this.filterRoles : undefined
        };
        this.currentPage = 0;
        this.first       = 0;
        this.reload$.next();
    }

    resetFilters(): void {
        this.filterFullName  = '';
        this.filterEmail     = '';
        this.filterCin       = '';
        this.filterStatut    = null;
        this.filterEnabled   = null;
        this.filterRoles     = [];
        this.appliedFilters  = {};
        this.currentPage     = 0;
        this.first           = 0;
        this.reload$.next();
    }

    // ── Pagination ─────────────────────────────────────────────────────────────
    onLazyLoad(event: TableLazyLoadEvent): void {
        this.currentPage = Math.floor((event.first ?? 0) / this.rowsPerPage);
        this.first       = event.first ?? 0;
        this.reload$.next();
    }

    // ── Navigation ─────────────────────────────────────────────────────────────
    addUser(): void {
        this.router.navigate(['/users/new']);
    }

    editUser(user: UserSummary): void {
        this.router.navigate(['/users', user.id]);
    }

    // ── Popover ────────────────────────────────────────────────────────────────
    openMenu(event: MouseEvent, user: UserSummary, popover: Popover): void {
        this.activeUser.set(user);
        popover.toggle(event);
    }

    // ── Toggle with ConfirmPopup ───────────────────────────────────────────────
    requestToggle(event: MouseEvent, popover: Popover): void {
        const user = this.activeUser();
        if (!user) return;

        const msgKey = user.enabled ? 'users.confirm_disable' : 'users.confirm_enable';

        this.confirmService.confirm({
            target:  event.currentTarget as EventTarget,
            message: this.translate.instant(msgKey),
            icon:    'pi pi-info-circle',
            acceptButtonProps: {
                label:    this.translate.instant('users.confirm_yes'),
                severity: 'danger'
            },
            rejectButtonProps: {
                label:    this.translate.instant('users.confirm_no'),
                outlined: true,
                severity: 'secondary'
            },
            accept: () => {
                popover.hide();
                this.executeToggle(user);
            },
            reject: () => popover.hide()
        });
    }

    private executeToggle(user: UserSummary): void {
        this.actionLoading.set(user.id);
        const action$ = user.enabled
            ? this.userService.disableUser(user.id)
            : this.userService.enableUser(user.id);

        action$.pipe(
            catchError(err => {
                this.actionLoading.set(null);
                if (err?.apiError?.code === 'ACCESS_DENIED') {
                    this.toastService.showError(this.translate.instant('users.error_own_account'));
                }
                return EMPTY;
            })
        ).subscribe(() => {
            this.actionLoading.set(null);
            this.reload$.next();
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    getStatutSeverity(statut: StatutJuridique): TagSeverity {
        return statut === 'ENTREPRISE' ? 'info' : 'secondary';
    }

    truncate(text: string, max = 40): string {
        return text?.length > max ? text.slice(0, max) + '…' : (text ?? '');
    }

    private buildQuery(): UserListQuery {
        return { ...this.appliedFilters, page: this.currentPage, size: this.rowsPerPage, sort: 'fullName,asc' };
    }
}
