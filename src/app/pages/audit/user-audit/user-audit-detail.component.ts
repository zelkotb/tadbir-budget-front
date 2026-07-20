import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService } from '@/app/pages/users/user.service';
import { OrgUnitService } from '@/app/services/org-unit.service';
import { UserAuditDiff, FieldChange, AuditAction } from '@/app/models/user.model';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Component({
    selector: 'app-user-audit-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, DatePipe, Card, TableModule, TagModule, ButtonModule, SkeletonModule, TranslatePipe],
    templateUrl: './user-audit-detail.component.html'
})
export class UserAuditDetail implements OnInit {
    private userService = inject(UserService);
    private orgService  = inject(OrgUnitService);
    private router      = inject(Router);
    private route       = inject(ActivatedRoute);

    readonly diff    = signal<UserAuditDiff | null>(null);
    readonly loading = signal(true);
    readonly notFound = signal(false);

    readonly actionSeverity: Record<AuditAction, TagSeverity> = {
        CREATE: 'success',
        UPDATE: 'info',
        DELETE: 'danger'
    };

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

    getSeverity(action: string): TagSeverity {
        return this.actionSeverity[action as AuditAction] ?? 'secondary';
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

    trackChange(_index: number, change: FieldChange): string {
        return change.field;
    }
}
