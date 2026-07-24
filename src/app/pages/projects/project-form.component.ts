import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TreeSelectModule } from 'primeng/treeselect';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { CharCounterComponent } from '@/app/components/char-counter/char-counter.component';
import { FieldErrorComponent } from '@/app/components/field-error/field-error.component';
import { ArabicKeyboardDirective } from '@/app/components/virtual-keyboard/virtual-keyboard.directive';
import { ToastService } from '@/app/services/toast.service';
import { ProjectService } from '@/app/pages/projects/project.service';
import { UserService } from '@/app/pages/users/user.service';
import { OrgUnitService } from '@/app/pages/organigramme/org-unit.service';
import { UserSummary } from '@/app/models/user.model';
import { OrgUnit, buildOrgTree } from '@/app/models/org-unit.model';
import { SettingsService } from '@/app/services/settings.service';
import { Project, TeamMemberInput } from '@/app/models/project.model';

interface TeamRow { userId: string | null; functionLabel: string; }

/**
 * Dedicated routed create/edit form (replaces the inline dialogs). Reuses the
 * common char-counter / field-error / virtual-keyboard (Arabic) components. The
 * field-error component renders BACKEND codes, so client-side validation is
 * surfaced by feeding it the same codes (REQUIRED / INVALID_SIZE). Poseidon.
 */
@Component({
    selector: 'app-project-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        Textarea,
        SelectModule,
        TreeSelectModule,
        TooltipModule,
        SkeletonModule,
        BackButtonComponent,
        CharCounterComponent,
        FieldErrorComponent,
        ArabicKeyboardDirective,
        TranslatePipe
    ],
    templateUrl: './project-form.component.html',
    styleUrl: './project-form.component.scss'
})
export class ProjectForm implements OnInit {
    private fb         = inject(FormBuilder);
    readonly service   = inject(ProjectService);
    readonly settings  = inject(SettingsService);
    readonly orgService = inject(OrgUnitService);
    private userService = inject(UserService);
    private toast      = inject(ToastService);
    private translate  = inject(TranslateService);
    private route      = inject(ActivatedRoute);
    private router     = inject(Router);
    private destroyRef = inject(DestroyRef);

    readonly id = this.route.snapshot.paramMap.get('id');
    readonly isEdit = !!this.id;

    readonly loading = signal(this.isEdit);
    readonly saving  = signal(false);
    readonly notFound = signal(false);
    private readonly project = signal<Project | null>(null);
    /** Org unit label shown read-only in edit mode (not editable after creation). */
    readonly orgUnitLabel = signal('');

    readonly MAX = { name: 255, objectifs: 2000, description: 5000, functionLabel: 255 } as const;

    // ── Reactive form ────────────────────────────────────────────────────────
    readonly form = this.fb.group({
        name:         ['', [Validators.required, Validators.maxLength(this.MAX.name)]],
        chefProjetId: [null as string | null, Validators.required],
        orgUnitId:    [null as string | null, Validators.required],
        objectifs:    ['', [Validators.required, Validators.maxLength(this.MAX.objectifs)]],
        description:  ['', Validators.maxLength(this.MAX.description)]
    });

    get nameCtrl()        { return this.form.get('name')!; }
    get chefCtrl()        { return this.form.get('chefProjetId')!; }
    get orgCtrl()         { return this.form.get('orgUnitId')!; }
    get objectifsCtrl()   { return this.form.get('objectifs')!; }
    get descriptionCtrl() { return this.form.get('description')!; }

    readonly fieldErrors = signal<Record<string, string>>({});

    // ── Pickers ──────────────────────────────────────────────────────────────
    readonly staff = signal<UserSummary[]>([]);
    readonly userOptions = computed(() =>
        this.staff().map((u) => ({ label: `${u.fullName} · ${u.uid}`, value: u.id }))
    );
    orgNode: TreeNode<OrgUnit> | null = null;
    readonly orgPickerTree = computed<TreeNode<OrgUnit>[]>(() => {
        const ids   = this.service.writableUnitIds();
        const units = this.orgService.units();
        return ids === null ? buildOrgTree(units) : buildOrgTree(units.filter((u) => ids.has(u.id)));
    });
    onOrgChange(): void {
        this.orgCtrl.setValue(this.orgNode?.data?.id ?? null);
        this.orgCtrl.markAsTouched();
        this.clearFieldError('orgUnitId');
    }

    // ── Team editor ──────────────────────────────────────────────────────────
    readonly teamRows = signal<TeamRow[]>([]);
    addTeamRow(): void { this.teamRows.update((r) => [...r, { userId: null, functionLabel: '' }]); }
    removeTeamRow(i: number): void { this.teamRows.update((r) => r.filter((_, idx) => idx !== i)); }
    setTeamUser(i: number, userId: string | null): void {
        this.teamRows.update((r) => r.map((row, idx) => (idx === i ? { ...row, userId } : row)));
    }
    setTeamFunction(i: number, functionLabel: string): void {
        this.teamRows.update((r) => r.map((row, idx) => (idx === i ? { ...row, functionLabel } : row)));
    }
    private buildTeam(): TeamMemberInput[] {
        const seen = new Set<string>();
        const out: TeamMemberInput[] = [];
        for (const row of this.teamRows()) {
            if (!row.userId || seen.has(row.userId)) continue;
            seen.add(row.userId);
            out.push({ userId: row.userId, functionLabel: row.functionLabel.trim() || null });
        }
        return out;
    }

    constructor() {
        // Keep users off a form they can't submit (server still enforces).
        effect(() => {
            if (!this.service.meReady()) return;
            if (this.isEdit) {
                const p = this.project();
                if (p && !this.service.canWriteProject(p)) {
                    this.router.navigate(['/projects', this.id]);
                }
            } else if (!this.service.canCreate()) {
                this.router.navigate(['/projects']);
            }
        });
    }

    ngOnInit(): void {
        this.service.ensureMe();
        this.orgService.ensureLoaded();
        this.userService.getStaff().pipe(catchError(() => of<UserSummary[]>([])))
            .subscribe((list) => this.staff.set(list));

        if (this.isEdit) this.loadForEdit();
    }

    private loadForEdit(): void {
        this.service.getOne(this.id!).pipe(catchError(() => of(null))).subscribe((p) => {
            this.loading.set(false);
            if (!p) { this.notFound.set(true); return; }
            this.project.set(p);
            this.orgUnitLabel.set(p.orgUnitName);
            this.form.patchValue({
                name:         p.name,
                chefProjetId: p.chefProjetId,
                orgUnitId:    p.orgUnitId,
                objectifs:    p.objectifs ?? '',
                description:  p.description ?? ''
            });
            this.teamRows.set((p.team ?? []).map((m) => ({ userId: m.userId, functionLabel: m.functionLabel ?? '' })));
        });
    }

    // ── Validation (surfaced through field-error via codes) ──────────────────
    private codeFor(field: string): string | null {
        const errs = this.form.get(field)?.errors;
        if (!errs) return null;
        if (errs['required'])  return 'REQUIRED';
        if (errs['maxlength']) return 'INVALID_SIZE';
        return 'INVALID_VALUE';
    }
    validateField(field: string): void {
        const code = this.codeFor(field);
        this.fieldErrors.update((m) => {
            const next = { ...m };
            if (code) next[field] = code; else delete next[field];
            return next;
        });
    }
    private clearFieldError(field: string): void {
        this.fieldErrors.update((m) => { const n = { ...m }; delete n[field]; return n; });
    }
    private readonly fieldOrder = ['name', 'chefProjetId', 'orgUnitId', 'objectifs', 'description'];
    private scrollToFirstError(): void {
        const first = this.fieldOrder.find((f) => this.form.get(f)?.invalid);
        if (first) document.getElementById('pf-field-' + first)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ── Submit ───────────────────────────────────────────────────────────────
    submit(): void {
        if (this.saving()) return;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            const all: Record<string, string> = {};
            for (const f of this.fieldOrder) { const c = this.codeFor(f); if (c) all[f] = c; }
            this.fieldErrors.set(all);
            this.scrollToFirstError();
            return;
        }

        this.saving.set(true);
        this.fieldErrors.set({});
        const v = this.form.getRawValue();
        const team = this.buildTeam();

        const onError = (err: { apiError?: { code?: string; fieldErrors?: Record<string, string> } }) => {
            this.saving.set(false);
            if (err?.apiError?.code === 'VALIDATION_ERROR') this.fieldErrors.set(err.apiError.fieldErrors ?? {});
            // ACCESS_DENIED / USER_NOT_FOUND / ORG_UNIT_NOT_FOUND / PROJECT_INVALID_STATUS toast via interceptor
        };
        const done = (id: string, msgKey: string) => {
            this.saving.set(false);
            this.toast.showSuccess(this.translate.instant(msgKey, this.settings.terms()));
            this.router.navigate(['/projects', id]);
        };

        if (this.isEdit) {
            this.service.update(this.id!, {
                name:         v.name!.trim(),
                objectifs:    v.objectifs!.trim() || null,
                description:  v.description!.trim() || null,
                chefProjetId: v.chefProjetId!
            }).pipe(switchMap(() => this.service.updateTeam(this.id!, team)))
              .subscribe({ next: () => done(this.id!, 'projects.saved_ok'), error: onError });
        } else {
            this.service.create({
                name:         v.name!.trim(),
                objectifs:    v.objectifs!.trim() || null,
                description:  v.description!.trim() || null,
                chefProjetId: v.chefProjetId!,
                orgUnitId:    v.orgUnitId!,
                team:         team.length ? team : undefined
            }).subscribe({ next: (created) => done(created.id, 'projects.created_ok'), error: onError });
        }
    }

    cancel(): void {
        this.router.navigate(this.isEdit ? ['/projects', this.id] : ['/projects']);
    }
}
