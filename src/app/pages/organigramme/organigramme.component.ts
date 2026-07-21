import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TreeSelectModule } from 'primeng/treeselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { AuthService } from '@/app/pages/auth/auth.service';
import { UserService } from '@/app/pages/users/user.service';
import { ToastService } from '@/app/services/toast.service';
import { OrgUnitService } from '@/app/pages/organigramme/org-unit.service';
import { IS_ADMIN, roleLabelKey } from '@/app/constants/roles';
import {
    KIND_SEVERITY,
    KNOWN_KINDS,
    OrgUnit,
    OrgUnitMember,
    buildOrgTree,
    subtreeIds
} from '@/app/models/org-unit.model';

type KindSeverity = 'info' | 'success' | 'warn' | 'secondary' | 'contrast' | undefined;

interface KindCardStyle { strip: string; bg: string; text: string; }

/**
 * Per-type card palette (strip / avatar+badge background / text). A fixed
 * categorical set, like chart series colors; unknown kinds fall back to slate.
 */
const KIND_CARD_STYLES: Record<string, KindCardStyle> = {
    PDG:                { strip: '#7c3aed', bg: '#f5f3ff', text: '#6d28d9' },   // violet — top
    DGD:                { strip: '#0d9488', bg: '#f0fdfa', text: '#0f766e' },   // teal — deputy
    POLE:               { strip: '#059669', bg: '#ecfdf5', text: '#059669' },
    DIRECTION:          { strip: '#6366f1', bg: '#eef0ff', text: '#6366f1' },
    DIVISION:           { strip: '#db2777', bg: '#fdf2f8', text: '#be185c' },   // pink
    DIRECTION_DELEGUEE: { strip: '#0ea5e9', bg: '#e8f6fd', text: '#0284c7' },
    DEPARTEMENT:        { strip: '#0ea5e9', bg: '#e8f6fd', text: '#0284c7' },
    SERVICE:            { strip: '#d97706', bg: '#fffbeb', text: '#b45309' }
};
const KIND_CARD_DEFAULT: KindCardStyle = { strip: '#94a3b8', bg: '#f1f5f9', text: '#475569' };

/**
 * Organigramme — company chart over GET /org-units, readable by every
 * authenticated user. Admin-only actions (create / edit / move / archive /
 * delete, manager assignment) are gated on the JWT roles claim; the server
 * enforces them anyway.
 *
 * All colors go through PrimeNG severities / theme tokens — no raw colors.
 */
@Component({
    selector: 'app-organigramme',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        OrganizationChartModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        DialogModule,
        SelectModule,
        TreeSelectModule,
        ToggleSwitchModule,
        TableModule,
        TooltipModule,
        SkeletonModule,
        ConfirmDialogModule,
        BackButtonComponent,
        TranslatePipe
    ],
    providers: [ConfirmationService],
    templateUrl: './organigramme.component.html',
    styleUrl: './organigramme.component.scss'
})
export class Organigramme implements OnInit {
    readonly orgService = inject(OrgUnitService);
    private auth        = inject(AuthService);
    private userService = inject(UserService);
    private toast       = inject(ToastService);
    private confirm     = inject(ConfirmationService);
    private translate   = inject(TranslateService);

    // ── Page state ──────────────────────────────────────────────────────────
    readonly isAdmin      = computed(() => IS_ADMIN(this.auth.currentUser()?.roles));
    readonly showArchived = signal(false);

    /** ngModel bridge for the archived toggle. */
    get showArchivedModel(): boolean { return this.showArchived(); }
    set showArchivedModel(v: boolean) { this.showArchived.set(v); }

    // ── Zoom ──────────────────────────────────────────────────────────────────
    readonly ZOOM_MIN = 0.5;
    readonly ZOOM_MAX = 2;
    private readonly ZOOM_STEP = 0.1;
    readonly zoom = signal(1);
    readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

    private setZoom(v: number): void {
        const clamped = Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, Math.round(v * 10) / 10));
        this.zoom.set(clamped);
    }
    zoomIn():    void { this.setZoom(this.zoom() + this.ZOOM_STEP); }
    zoomOut():   void { this.setZoom(this.zoom() - this.ZOOM_STEP); }
    resetZoom(): void { this.zoom.set(1); }

    /** One chart per root; archived units only when the toggle is on. */
    readonly rootNodes = computed(() =>
        buildOrgTree(this.orgService.units(), { includeArchived: this.showArchived() })
    );

    readonly roleLabelKey = roleLabelKey;

    // ── Details dialog ──────────────────────────────────────────────────────
    readonly detailsUnit     = signal<OrgUnit | null>(null);
    readonly members         = signal<OrgUnitMember[]>([]);
    readonly membersLoading  = signal(false);
    includeSubtree = false;

    // Truthy placeholders so the #body template renders during loading.
    readonly memberSkeletons = Array(4).fill(true);

    // ── Create / edit dialog ────────────────────────────────────────────────
    readonly formOpen   = signal(false);
    readonly formSaving = signal(false);
    /** Unit being edited; null = create mode. */
    readonly editing    = signal<OrgUnit | null>(null);
    /** Parent prefilled for "Ajouter une sous-unité"; null = root unit. */
    readonly formParent = signal<OrgUnit | null>(null);

    formName = '';
    formKind: string | null = null;
    formManagerId: string | null = null;

    /** Kind suggestions — labels resolved at dialog-open time (translations loaded by then). */
    readonly kindSelectOptions = signal<{ label: string; value: string }[]>([]);

    /** Manager picker options — loaded once, on first dialog open. */
    readonly managerOptions = signal<{ label: string; value: string }[]>([]);
    readonly managersLoading = signal(false);
    private managersLoaded = false;

    // ── Move dialog ─────────────────────────────────────────────────────────
    readonly moveOpen   = signal(false);
    readonly moveSaving = signal(false);
    readonly moving     = signal<OrgUnit | null>(null);
    moveTarget: TreeNode<OrgUnit> | null = null;
    moveToRoot = false;

    /** Parent picker tree — the moved node + its whole subtree are disabled (cycle rule). */
    readonly moveTree = computed<TreeNode<OrgUnit>[]>(() => {
        const moved = this.moving();
        if (!moved) return [];
        return buildOrgTree(this.orgService.units(), {
            includeArchived: this.showArchived(),
            disabledIds: subtreeIds(this.orgService.units(), moved.id)
        });
    });

    ngOnInit(): void {
        this.orgService.ensureLoaded();
    }

    // ── Assign-responsible dialog ───────────────────────────────────────────
    readonly assignOpen   = signal(false);
    readonly assignSaving = signal(false);
    readonly assignUnit   = signal<OrgUnit | null>(null);
    assignManagerId: string | null = null;

    // ── Display helpers ─────────────────────────────────────────────────────
    kindSeverity(kind: string): KindSeverity {
        return kind in KIND_SEVERITY ? KIND_SEVERITY[kind] : 'secondary';
    }

    /** Card color set for a unit kind (strip / avatar+badge bg / text). */
    kindStyle(kind: string): KindCardStyle {
        return KIND_CARD_STYLES[kind] ?? KIND_CARD_DEFAULT;
    }

    /** 2-letter initials of the unit name for the avatar. */
    initials(name: string): string {
        const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return '?';
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    }

    /** Known kinds get a translated label; unknown kinds render as-is. */
    kindLabel(kind: string): string {
        return (KNOWN_KINDS as readonly string[]).includes(kind)
            ? this.translate.instant(`org.kinds.${kind}`)
            : kind;
    }

    // ── Details ─────────────────────────────────────────────────────────────
    openDetails(unit: OrgUnit): void {
        this.detailsUnit.set(unit);
        this.includeSubtree = false;
        this.loadMembers();
    }

    loadMembers(): void {
        const unit = this.detailsUnit();
        if (!unit) return;
        this.membersLoading.set(true);
        this.orgService.getMembers(unit.id, this.includeSubtree).pipe(
            catchError(() => of<OrgUnitMember[]>([]))
        ).subscribe((members) => {
            this.members.set(members);
            this.membersLoading.set(false);
        });
    }

    closeDetails(): void {
        this.detailsUnit.set(null);
        this.members.set([]);
    }

    // ── Create / edit ───────────────────────────────────────────────────────
    openCreate(parent: OrgUnit | null): void {
        this.editing.set(null);
        this.formParent.set(parent);
        this.formName = '';
        this.formKind = null;
        this.formManagerId = null;
        this.prepareFormOptions();
        this.formOpen.set(true);
    }

    openEdit(unit: OrgUnit): void {
        this.editing.set(unit);
        this.formParent.set(unit.parentId ? (this.orgService.byId().get(unit.parentId) ?? null) : null);
        this.formName = unit.name;
        this.formKind = unit.kind;
        this.formManagerId = unit.managerId;
        this.prepareFormOptions();
        this.formOpen.set(true);
    }

    private prepareFormOptions(): void {
        this.kindSelectOptions.set(
            KNOWN_KINDS.map((k) => ({ label: this.kindLabel(k), value: k }))
        );
        this.ensureManagersLoaded();
    }

    get formValid(): boolean {
        const name = this.formName.trim();
        return name.length > 0 && name.length <= 255 && !!this.formKind?.trim();
    }

    saveForm(): void {
        if (!this.formValid || this.formSaving()) return;
        const name = this.formName.trim();
        const kind = this.formKind!.trim();
        const editing = this.editing();

        this.formSaving.set(true);

        if (!editing) {
            this.orgService.create({
                name,
                kind,
                parentId:  this.formParent()?.id ?? null,
                managerId: this.formManagerId ?? null
            }).subscribe({
                next: () => {
                    this.formSaving.set(false);
                    this.formOpen.set(false);
                    this.toast.showSuccess(this.translate.instant('org.created'));
                },
                error: () => this.formSaving.set(false)   // toast via global interceptor
            });
            return;
        }

        // PATCH only the changed fields (null = unchanged server-side).
        const patch: Record<string, unknown> = {};
        if (name !== editing.name) patch['name'] = name;
        if (kind !== editing.kind) patch['kind'] = kind;
        if (this.formManagerId !== editing.managerId) {
            if (this.formManagerId) patch['managerId'] = this.formManagerId;
            else patch['clearManager'] = true;
        }
        if (Object.keys(patch).length === 0) {
            this.formSaving.set(false);
            this.formOpen.set(false);
            return;
        }
        this.orgService.update(editing.id, patch).subscribe({
            next: () => {
                this.formSaving.set(false);
                this.formOpen.set(false);
                this.toast.showSuccess(this.translate.instant('org.updated'));
            },
            error: () => this.formSaving.set(false)
        });
    }

    // ── Assign responsible (quick action) ───────────────────────────────────
    openAssign(unit: OrgUnit): void {
        this.assignUnit.set(unit);
        this.assignManagerId = unit.managerId;
        this.ensureManagersLoaded();
        this.assignOpen.set(true);
    }

    saveAssign(): void {
        const unit = this.assignUnit();
        if (!unit || this.assignSaving()) return;
        if (this.assignManagerId === unit.managerId) { this.assignOpen.set(false); return; }

        this.assignSaving.set(true);
        const patch = this.assignManagerId ? { managerId: this.assignManagerId } : { clearManager: true };
        this.orgService.update(unit.id, patch).subscribe({
            next: () => {
                this.assignSaving.set(false);
                this.assignOpen.set(false);
                this.toast.showSuccess(this.translate.instant('org.updated'));
            },
            error: () => this.assignSaving.set(false)
        });
    }

    private ensureManagersLoaded(): void {
        if (this.managersLoaded || this.managersLoading()) return;
        this.managersLoading.set(true);
        this.userService.getUsers({ page: 0, size: 1000, sort: 'fullName,asc' }).pipe(
            catchError(() => of(null))
        ).subscribe((page) => {
            if (page) {
                this.managerOptions.set(page.content.map((u) => ({ label: `${u.fullName} — ${u.uid}`, value: u.id })));
                this.managersLoaded = true;
            }
            this.managersLoading.set(false);
        });
    }

    // ── Move ────────────────────────────────────────────────────────────────
    openMove(unit: OrgUnit): void {
        this.moving.set(unit);
        this.moveTarget = null;
        this.moveToRoot = false;
        this.moveOpen.set(true);
    }

    get moveValid(): boolean {
        return this.moveToRoot || (!!this.moveTarget?.data && this.moveTarget.selectable !== false);
    }

    saveMove(): void {
        const unit = this.moving();
        if (!unit || !this.moveValid || this.moveSaving()) return;

        this.moveSaving.set(true);
        const patch = this.moveToRoot ? { moveToRoot: true } : { parentId: this.moveTarget!.data!.id };
        this.orgService.update(unit.id, patch).subscribe({
            next: () => {
                this.moveSaving.set(false);
                this.moveOpen.set(false);
                this.toast.showSuccess(this.translate.instant('org.moved'));
            },
            error: () => this.moveSaving.set(false)   // ORG_UNIT_CYCLE toast via interceptor
        });
    }

    // ── Archive / restore / delete ──────────────────────────────────────────
    confirmArchiveToggle(unit: OrgUnit): void {
        const restoring = !unit.active;
        this.confirm.confirm({
            message: this.translate.instant(restoring ? 'org.confirm_restore' : 'org.confirm_archive'),
            header:  this.translate.instant(restoring ? 'org.restore' : 'org.archive'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('org.confirm_yes'), severity: restoring ? 'primary' : 'warn' },
            rejectButtonProps: { label: this.translate.instant('org.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.orgService.update(unit.id, { active: restoring }).subscribe({
                    next: () => this.toast.showSuccess(this.translate.instant(restoring ? 'org.restored_ok' : 'org.archived_ok'))
                });
            }
        });
    }

    confirmDelete(unit: OrgUnit): void {
        this.confirm.confirm({
            message: this.translate.instant('org.confirm_delete'),
            header:  this.translate.instant('org.delete'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('org.confirm_yes'), severity: 'danger' },
            rejectButtonProps: { label: this.translate.instant('org.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.orgService.delete(unit.id).subscribe({
                    next: () => {
                        this.toast.showSuccess(this.translate.instant('org.deleted_ok'));
                        if (this.detailsUnit()?.id === unit.id) this.closeDetails();
                    }
                    // ORG_UNIT_HAS_CHILDREN / ORG_UNIT_HAS_USERS → toast via interceptor
                });
            }
        });
    }
}
