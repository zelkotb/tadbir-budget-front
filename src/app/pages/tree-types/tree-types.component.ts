import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@/app/pages/auth/auth.service';
import { ToastService } from '@/app/services/toast.service';
import { TreeTypeService } from '@/app/pages/tree-types/tree-type.service';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { Roles, hasRole } from '@/app/constants/roles';
import { TreeType, UpdateTreeTypeInput } from '@/app/models/tree-type.model';

/**
 * "Types d'arborescence" — templates of ordered levels for a budget chart of
 * accounts (Chapitre › Article › … › Ligne). Reference data readable by every
 * authenticated user; create/edit/delete are gated on ADMIN / CONTROLE_GESTION
 * (server-enforced). No hardcoded colors — severities + theme tokens only.
 */
@Component({
    selector: 'app-tree-types',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        TagModule,
        BadgeModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        Textarea,
        ToggleSwitchModule,
        ConfirmDialogModule,
        TooltipModule,
        SkeletonModule,
        BackButtonComponent,
        TranslatePipe
    ],
    providers: [ConfirmationService],
    templateUrl: './tree-types.component.html',
    styleUrl: './tree-types.component.scss'
})
export class TreeTypes implements OnInit {
    readonly treeService = inject(TreeTypeService);
    private auth      = inject(AuthService);
    private toast     = inject(ToastService);
    private confirm   = inject(ConfirmationService);
    private translate = inject(TranslateService);

    readonly canWrite = computed(() => hasRole(this.auth.currentUser()?.roles, Roles.ADMIN, Roles.CONTROLE_GESTION));

    // ── List ─────────────────────────────────────────────────────────────────
    readonly showInactive = signal(false);
    get showInactiveModel(): boolean { return this.showInactive(); }
    set showInactiveModel(v: boolean) { this.showInactive.set(v); }

    readonly visibleTypes = computed(() => {
        const all = this.treeService.types();
        return this.showInactive() ? all : all.filter((t) => t.active);
    });

    readonly skeletonRows = Array(4).fill(true);

    // ── Create / edit dialog ─────────────────────────────────────────────────
    readonly formOpen   = signal(false);
    readonly formSaving = signal(false);
    readonly editing    = signal<TreeType | null>(null);
    readonly fieldErrors = signal<Record<string, string>>({});

    formName = '';
    formDescription = '';
    formActive = true;
    /** Ordered level names — signal so add/remove/move re-render (zoneless). */
    readonly levels = signal<string[]>(['']);

    ngOnInit(): void {
        this.treeService.ensureLoaded();
    }

    // ── Levels editor ────────────────────────────────────────────────────────
    addLevel(): void { this.levels.update((a) => [...a, '']); }
    removeLevel(i: number): void {
        this.levels.update((a) => (a.length > 1 ? a.filter((_, idx) => idx !== i) : a));
    }
    setLevel(i: number, value: string): void {
        this.levels.update((a) => a.map((x, idx) => (idx === i ? value : x)));
    }
    moveUp(i: number): void {
        this.levels.update((a) => {
            if (i <= 0) return a;
            const b = [...a]; [b[i - 1], b[i]] = [b[i], b[i - 1]]; return b;
        });
    }
    moveDown(i: number): void {
        this.levels.update((a) => {
            if (i >= a.length - 1) return a;
            const b = [...a]; [b[i], b[i + 1]] = [b[i + 1], b[i]]; return b;
        });
    }

    /** Trimmed, non-blank level names, in order. */
    get cleanLevels(): string[] {
        return this.levels().map((l) => l.trim()).filter(Boolean);
    }
    /** Case-insensitive duplicate among the non-blank levels (pre-empts the server guard). */
    get hasDuplicateLevels(): boolean {
        const lower = this.cleanLevels.map((l) => l.toLowerCase());
        return new Set(lower).size !== lower.length;
    }
    get formValid(): boolean {
        const name = this.formName.trim();
        return name.length > 0 && name.length <= 255
            && this.formDescription.length <= 500
            && this.cleanLevels.length >= 1
            && !this.hasDuplicateLevels;
    }

    // ── Open / save ──────────────────────────────────────────────────────────
    openCreate(): void {
        this.editing.set(null);
        this.formName = '';
        this.formDescription = '';
        this.formActive = true;
        this.levels.set(['']);
        this.fieldErrors.set({});
        this.formOpen.set(true);
    }

    openEdit(type: TreeType): void {
        this.editing.set(type);
        this.formName = type.name;
        this.formDescription = type.description ?? '';
        this.formActive = type.active;
        this.levels.set(type.levels.map((l) => l.name));
        this.fieldErrors.set({});
        this.formOpen.set(true);
    }

    save(): void {
        if (!this.formValid || this.formSaving()) return;

        this.formSaving.set(true);
        this.fieldErrors.set({});

        const name = this.formName.trim();
        const description = this.formDescription.trim() || null;
        const levels = this.cleanLevels;
        const editing = this.editing();

        const done = (msgKey: string) => {
            this.formSaving.set(false);
            this.formOpen.set(false);
            this.toast.showSuccess(this.translate.instant(msgKey));
        };
        const fail = (err: { apiError?: { code?: string; fieldErrors?: Record<string, string> } }) => {
            this.formSaving.set(false);
            if (err?.apiError?.code === 'VALIDATION_ERROR') {
                this.fieldErrors.set(err.apiError.fieldErrors ?? {});
            }
            // NAME_EXISTS / NO_LEVELS / DUPLICATE toast via the global interceptor.
        };

        if (!editing) {
            this.treeService.create({ name, description, levels })
                .subscribe({ next: () => done('tree.created'), error: fail });
            return;
        }

        const patch: UpdateTreeTypeInput = { name, description, active: this.formActive };
        const originalLevels = editing.levels.map((l) => l.name);
        if (JSON.stringify(levels) !== JSON.stringify(originalLevels)) {
            patch.levels = levels;   // sending levels replaces the whole ordered list
        }
        this.treeService.update(editing.id, patch)
            .subscribe({ next: () => done('tree.updated'), error: fail });
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    confirmDelete(type: TreeType): void {
        this.confirm.confirm({
            message: this.translate.instant('tree.confirm_delete', { name: type.name }),
            header:  this.translate.instant('tree.delete'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('tree.confirm_yes'), severity: 'danger' },
            rejectButtonProps: { label: this.translate.instant('tree.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.treeService.delete(type.id).subscribe({
                    next: () => this.toast.showSuccess(this.translate.instant('tree.deleted_ok'))
                    // NOMENCLATURE_DEFINITION_NOT_FOUND toast via interceptor
                });
            }
        });
    }
}
