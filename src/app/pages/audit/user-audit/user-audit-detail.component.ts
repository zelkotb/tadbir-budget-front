import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslatePipe } from '@ngx-translate/core';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { UserService } from '@/app/pages/users/user.service';
import { OrgUnitService } from '@/app/pages/organigramme/org-unit.service';
import { UserAuditDiff } from '@/app/models/user.model';

@Component({
    selector: 'app-user-audit-detail',
    standalone: true,
    imports: [CommonModule, SkeletonModule, TranslatePipe, BackButtonComponent],
    templateUrl: './user-audit-detail.component.html',
    styleUrl: './user-audit-detail.component.scss'
})
export class UserAuditDetail implements OnInit {
    private userService = inject(UserService);
    private orgService  = inject(OrgUnitService);
    private router      = inject(Router);
    private route       = inject(ActivatedRoute);

    readonly diff    = signal<UserAuditDiff | null>(null);
    readonly loading = signal(true);
    readonly notFound = signal(false);

    /** UPDATE revisions get the before/after diff highlight; CREATE/DELETE stay plain. */
    get isUpdate(): boolean { return this.diff()?.action === 'UPDATE'; }

    /** Field key → human-readable label i18n key (unknown keys render as-is). */
    private readonly FIELD_LABELS: Record<string, string> = {
        uid:         'audit.user.detail.fields.uid',
        fullName:    'audit.user.detail.fields.fullName',
        email:       'audit.user.detail.fields.email',
        phoneNumber: 'audit.user.detail.fields.phoneNumber',
        roles:       'audit.user.detail.fields.roles',
        orgUnitId:   'audit.user.detail.fields.orgUnitId',
        enabled:     'audit.user.detail.fields.enabled'
    };
    fieldLabelKey(field: string): string { return this.FIELD_LABELS[field] ?? field; }

    /** Action → Poseidon pill class. */
    actionPill(action: string): string {
        switch (action) {
            case 'CREATE': return 'rd-action-create';
            case 'DELETE': return 'rd-action-delete';
            default:       return 'rd-action-update';
        }
    }

    ngOnInit(): void {
        // Org-units cache — orgUnitId diffs render as the unit name.
        this.orgService.ensureLoaded();

        const revisionId = Number(this.route.snapshot.paramMap.get('revisionId'));

        this.userService.getUserAuditDiff(revisionId).pipe(
            catchError(() => {
                this.loading.set(false);
                this.notFound.set(true);
                return EMPTY;
            })
        ).subscribe((diff) => {
            this.diff.set(diff);
            this.loading.set(false);
        });
    }

    back(): void {
        this.router.navigate(['/audit/user-audit'], { queryParams: this.route.snapshot.queryParams });
    }

    isEmpty(value: unknown): boolean {
        return value === null || value === undefined;
    }

    isRoles(field: string, value: unknown): value is string[] {
        return field === 'roles' && Array.isArray(value);
    }

    isEnabled(field: string): boolean {
        return field === 'enabled';
    }

    isOrgUnit(field: string): boolean {
        return field === 'orgUnitId';
    }

    /** Unit name for an orgUnitId diff value; falls back to the raw id. */
    orgUnitLabel(value: unknown): string {
        return this.orgService.unitName(value == null ? null : String(value)) ?? String(value ?? '');
    }

    asRoles(value: unknown): string[] {
        return value as string[];
    }

    asPlain(value: unknown): string {
        return value == null ? '' : String(value);
    }

    /** Display string for a scalar cell (org-unit id → name). */
    displayValue(field: string, value: unknown): string {
        return this.isOrgUnit(field) ? this.orgUnitLabel(value) : this.asPlain(value);
    }
}
