import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TreeSelectModule } from 'primeng/treeselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@/app/pages/auth/auth.service';
import { ToastService } from '@/app/services/toast.service';
import { NomenclatureService } from '@/app/pages/nomenclatures/nomenclature.service';
import { OrgUnitService } from '@/app/pages/organigramme/org-unit.service';
import { OrgUnit } from '@/app/models/org-unit.model';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { Roles, hasRole } from '@/app/constants/roles';
import {
    Nomenclature,
    Rubrique,
    RubriqueAssignment,
    RubriqueNode,
    buildRubriqueTree,
    rubriqueHasChildren
} from '@/app/models/nomenclature.model';

type BuilderMode = 'structure' | 'assignments';

type RubriqueMode = 'add-root' | 'add-sub' | 'edit';

/**
 * Nomenclature builder — the rubrique tree. Editing (add/rename/delete) is gated
 * on status !== 'ARCHIVED' AND admin/CdG (mirrors the server, so users don't hit
 * 409s). FIXED stays editable — it's "published/usable", not frozen; only
 * ARCHIVED is read-only. A FIXED nomenclature can be cloned into a new DRAFT
 * version of the same lineage. Severities/tokens only — no hardcoded colors.
 */
@Component({
    selector: 'app-nomenclature-builder',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        TagModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        CheckboxModule,
        TreeSelectModule,
        ConfirmDialogModule,
        TooltipModule,
        SkeletonModule,
        BackButtonComponent,
        TranslatePipe
    ],
    providers: [ConfirmationService],
    templateUrl: './nomenclature-builder.component.html',
    styleUrl: './nomenclature-builder.component.scss'
})
export class NomenclatureBuilder implements OnInit {
    private service    = inject(NomenclatureService);
    readonly orgService = inject(OrgUnitService);
    private auth       = inject(AuthService);
    private toast      = inject(ToastService);
    private confirm    = inject(ConfirmationService);
    private translate  = inject(TranslateService);
    private route      = inject(ActivatedRoute);
    private router     = inject(Router);
    private destroyRef = inject(DestroyRef);

    private id = this.route.snapshot.paramMap.get('id')!;

    // ── State ────────────────────────────────────────────────────────────────
    readonly nomenclature = signal<Nomenclature | null>(null);
    readonly rubriques    = signal<Rubrique[]>([]);
    readonly loading      = signal(true);
    readonly notFound     = signal(false);
    readonly busy         = signal(false);   // fix / archive / clone in flight

    // ── Versioning ───────────────────────────────────────────────────────────
    readonly versions = signal<Nomenclature[]>([]);
    /** Options for the version switcher (oldest → newest). */
    readonly versionOptions = computed(() =>
        this.versions().map((v) => ({ value: v.id, version: v.version, status: v.status }))
    );

    readonly tree = computed<RubriqueNode[]>(() => buildRubriqueTree(this.rubriques()));

    /** Collapsed node ids (nodes are expanded by default; new ones too). */
    private readonly collapsed = signal<Set<string>>(new Set());
    isExpanded(id: string): boolean { return !this.collapsed().has(id); }
    toggleExpand(id: string): void {
        this.collapsed.update((s) => {
            const next = new Set(s);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    readonly canWrite = computed(() => hasRole(this.auth.currentUser()?.roles, Roles.ADMIN, Roles.CONTROLE_GESTION));
    /** Editable while not ARCHIVED (FIXED stays editable) and the user may write. */
    readonly canEdit = computed(() => this.canWrite() && this.nomenclature()?.status !== 'ARCHIVED');

    // ── Affectations mode (FIXED + admin/CdG) ────────────────────────────────
    readonly mode = signal<BuilderMode>('structure');
    /** The Affectations tab exists only for a FIXED nomenclature and a writer. */
    readonly showAssignments = computed(() => this.canWrite() && this.nomenclature()?.status === 'FIXED');

    readonly assignments = signal<RubriqueAssignment[]>([]);
    private readonly assignmentsByRubrique = computed(() => {
        const map = new Map<string, RubriqueAssignment[]>();
        for (const a of this.assignments()) {
            const list = map.get(a.rubriqueId) ?? [];
            list.push(a);
            map.set(a.rubriqueId, list);
        }
        return map;
    });
    assignmentsFor(rubriqueId: string): RubriqueAssignment[] {
        return this.assignmentsByRubrique().get(rubriqueId) ?? [];
    }

    readonly orgTree = computed(() => this.orgService.activeTree());

    // Assign dialog
    readonly assignOpen     = signal(false);
    readonly assignSaving   = signal(false);
    readonly assignRubrique = signal<Rubrique | null>(null);
    assignOrgUnit: TreeNode<OrgUnit> | null = null;

    // "Usable by unit" preview filter — null = no filter (nothing greyed).
    usableFilterNode: TreeNode<OrgUnit> | null = null;
    readonly usableIds = signal<Set<string> | null>(null);

    setMode(m: BuilderMode): void {
        this.mode.set(m);
        if (m === 'assignments') {
            this.orgService.ensureLoaded();
            this.loadAssignments();
        }
    }
    private loadAssignments(): void {
        this.service.getAssignments(this.id).pipe(catchError(() => of<RubriqueAssignment[]>([])))
            .subscribe((list) => this.assignments.set(list));
    }

    /** Grey a node when a usable-filter is active and the node isn't in the result. */
    isUsableGreyed(rubriqueId: string): boolean {
        const set = this.usableIds();
        return !!set && !set.has(rubriqueId);
    }

    onUsableFilterChange(): void {
        const unit = this.usableFilterNode?.data;
        if (!unit) { this.usableIds.set(null); return; }
        this.service.getUsableRubriques(this.id, unit.id).pipe(catchError(() => of<Rubrique[]>([])))
            .subscribe((list) => this.usableIds.set(new Set(list.map((r) => r.id))));
    }

    openAssign(r: Rubrique): void {
        this.assignRubrique.set(r);
        this.assignOrgUnit = null;
        this.orgService.ensureLoaded();
        this.assignOpen.set(true);
    }
    get assignValid(): boolean {
        return !!this.assignOrgUnit?.data;
    }
    saveAssign(): void {
        const r = this.assignRubrique();
        const unit = this.assignOrgUnit?.data;
        if (!r || !unit || this.assignSaving()) return;
        this.assignSaving.set(true);
        this.service.createAssignment(this.id, { rubriqueId: r.id, orgUnitId: unit.id }).subscribe({
            next: () => {
                this.assignSaving.set(false);
                this.assignOpen.set(false);
                this.toast.showSuccess(this.translate.instant('nom.assign.assigned_ok'));
                this.loadAssignments();
            },
            error: () => this.assignSaving.set(false)   // EXISTS / NOT_FIXED toast via interceptor
        });
    }
    removeAssignment(a: RubriqueAssignment): void {
        this.service.deleteAssignment(this.id, a.id).subscribe({
            next: () => { this.toast.showSuccess(this.translate.instant('nom.assign.removed_ok')); this.loadAssignments(); }
        });
    }

    ngOnInit(): void {
        // React to :id changes too — the version switcher navigates within this route.
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
            this.id = pm.get('id')!;
            this.notFound.set(false);
            this.mode.set('structure');
            this.usableFilterNode = null;
            this.usableIds.set(null);
            this.reloadAll();
            this.loadVersions();
        });
    }

    private reloadAll(): void {
        this.loading.set(true);
        this.service.getOne(this.id).pipe(catchError(() => of(null))).subscribe((nom) => {
            if (!nom) { this.loading.set(false); this.notFound.set(true); return; }
            this.nomenclature.set(nom);
            this.loadRubriques(() => this.loading.set(false));
        });
    }

    private loadVersions(): void {
        this.service.getVersions(this.id).pipe(catchError(() => of<Nomenclature[]>([])))
            .subscribe((list) => this.versions.set(list));
    }

    switchVersion(id: string): void {
        if (id && id !== this.id) this.router.navigate(['/nomenclatures', id]);
    }

    private loadRubriques(done?: () => void): void {
        this.service.getRubriques(this.id).pipe(catchError(() => of<Rubrique[]>([]))).subscribe((list) => {
            this.rubriques.set(list);
            done?.();
        });
    }

    /** After a rubrique mutation the count/state may change — refresh the header too. */
    private refreshAfterRubriqueChange(): void {
        this.loadRubriques();
        this.service.getOne(this.id).pipe(catchError(() => of(null))).subscribe((nom) => {
            if (nom) this.nomenclature.set(nom);
        });
    }

    hasChildren(r: Rubrique): boolean {
        return rubriqueHasChildren(this.rubriques(), r.id);
    }

    /** NIVEAUX chip color class: leaf → green, else by level position (cycled). */
    levelChipClass(position: number, leaf: boolean): string {
        return leaf ? 'nb-chip-leaf' : `nb-chip-${((Math.max(1, position) - 1) % 3) + 1}`;
    }

    // ── Rubrique dialog ──────────────────────────────────────────────────────
    readonly rDialogOpen = signal(false);
    readonly rSaving     = signal(false);
    readonly rMode       = signal<RubriqueMode>('add-root');
    readonly rParent     = signal<Rubrique | null>(null);
    readonly rEditing    = signal<Rubrique | null>(null);
    readonly rFieldErrors = signal<Record<string, string>>({});
    rCode = '';
    rLabel = '';

    openAddRoot(): void {
        this.rMode.set('add-root');
        this.rParent.set(null);
        this.rEditing.set(null);
        this.rCode = ''; this.rLabel = '';
        this.rFieldErrors.set({});
        this.rDialogOpen.set(true);
    }
    openAddSub(parent: Rubrique): void {
        if (parent.leaf) return;   // leaves can't have children
        this.rMode.set('add-sub');
        this.rParent.set(parent);
        this.rEditing.set(null);
        this.rCode = ''; this.rLabel = '';
        this.rFieldErrors.set({});
        this.rDialogOpen.set(true);
    }
    openEdit(r: Rubrique): void {
        this.rMode.set('edit');
        this.rEditing.set(r);
        this.rParent.set(null);
        this.rCode = r.code; this.rLabel = r.label;
        this.rFieldErrors.set({});
        this.rDialogOpen.set(true);
    }

    get rValid(): boolean {
        return this.rCode.trim().length > 0 && this.rCode.trim().length <= 50
            && this.rLabel.trim().length > 0 && this.rLabel.trim().length <= 255;
    }

    saveRubrique(): void {
        if (!this.rValid || this.rSaving()) return;
        this.rSaving.set(true);
        this.rFieldErrors.set({});
        const code = this.rCode.trim();
        const label = this.rLabel.trim();

        const ok = (msgKey: string) => {
            this.rSaving.set(false);
            this.rDialogOpen.set(false);
            this.toast.showSuccess(this.translate.instant(msgKey));
            this.refreshAfterRubriqueChange();
        };
        const fail = (err: { apiError?: { code?: string; fieldErrors?: Record<string, string> } }) => {
            this.rSaving.set(false);
            if (err?.apiError?.code === 'VALIDATION_ERROR') this.rFieldErrors.set(err.apiError.fieldErrors ?? {});
            // CODE_EXISTS / PARENT_IS_LEAF / NOT_DRAFT toast via the interceptor.
        };

        if (this.rMode() === 'edit') {
            const r = this.rEditing()!;
            const patch: { code?: string; label?: string } = {};
            if (code !== r.code) patch.code = code;
            if (label !== r.label) patch.label = label;
            if (!patch.code && !patch.label) { this.rSaving.set(false); this.rDialogOpen.set(false); return; }
            this.service.updateRubrique(this.id, r.id, patch).subscribe({ next: () => ok('nom.rubrique_saved'), error: fail });
        } else {
            this.service.createRubrique(this.id, { parentId: this.rParent()?.id ?? null, code, label })
                .subscribe({ next: () => ok('nom.rubrique_added'), error: fail });
        }
    }

    confirmDeleteRubrique(r: Rubrique): void {
        this.confirm.confirm({
            message: this.translate.instant('nom.confirm_delete_rubrique', { code: r.code }),
            header:  this.translate.instant('nom.delete_rubrique'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('nom.confirm_yes'), severity: 'danger' },
            rejectButtonProps: { label: this.translate.instant('nom.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.service.deleteRubrique(this.id, r.id).subscribe({
                    next: () => { this.toast.showSuccess(this.translate.instant('nom.rubrique_deleted')); this.refreshAfterRubriqueChange(); }
                    // RUBRIQUE_HAS_CHILDREN toast via interceptor
                });
            }
        });
    }

    // ── Fix / archive ────────────────────────────────────────────────────────
    confirmFix(): void {
        const nom = this.nomenclature();
        if (!nom || this.rubriques().length === 0) return;
        this.confirm.confirm({
            message: this.translate.instant('nom.confirm_fix'),
            header:  this.translate.instant('nom.fix'),
            icon: 'pi pi-lock',
            acceptButtonProps: { label: this.translate.instant('nom.fix'), severity: 'success' },
            rejectButtonProps: { label: this.translate.instant('nom.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.busy.set(true);
                this.service.fix(nom.id).subscribe({
                    next: (updated) => { this.busy.set(false); this.nomenclature.set(updated); this.toast.showSuccess(this.translate.instant('nom.fixed_ok')); },
                    error: () => this.busy.set(false)
                });
            }
        });
    }

    confirmArchive(): void {
        const nom = this.nomenclature();
        if (!nom) return;
        this.confirm.confirm({
            message: this.translate.instant('nom.confirm_archive'),
            header:  this.translate.instant('nom.archive'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('nom.archive'), severity: 'warn' },
            rejectButtonProps: { label: this.translate.instant('nom.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.busy.set(true);
                this.service.archive(nom.id).subscribe({
                    next: (updated) => { this.busy.set(false); this.nomenclature.set(updated); this.toast.showSuccess(this.translate.instant('nom.archived_ok')); },
                    error: () => this.busy.set(false)
                });
            }
        });
    }

    // ── New version (clone) ──────────────────────────────────────────────────
    readonly versionOpen   = signal(false);
    readonly versionSaving = signal(false);
    copyAssignments = false;

    openNewVersion(): void {
        this.copyAssignments = false;
        this.versionOpen.set(true);
    }
    createVersion(): void {
        const nom = this.nomenclature();
        if (!nom || this.versionSaving()) return;
        this.versionSaving.set(true);
        this.service.clone(nom.id, this.copyAssignments).subscribe({
            next: (created) => {
                this.versionSaving.set(false);
                this.versionOpen.set(false);
                this.toast.showSuccess(this.translate.instant('nom.version.created_ok'));
                this.router.navigate(['/nomenclatures', created.id]);   // straight to the new DRAFT
            },
            error: () => this.versionSaving.set(false)   // NOMENCLATURE_ARCHIVED etc. toast via interceptor
        });
    }

    get rDialogHeaderKey(): string {
        switch (this.rMode()) {
            case 'edit':    return 'nom.edit_rubrique';
            case 'add-sub': return 'nom.add_sub';
            default:        return 'nom.add_root';
        }
    }
}
