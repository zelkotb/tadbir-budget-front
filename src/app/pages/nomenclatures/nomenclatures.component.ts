import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@/app/pages/auth/auth.service';
import { ToastService } from '@/app/services/toast.service';
import { NomenclatureService } from '@/app/pages/nomenclatures/nomenclature.service';
import { TreeTypeService } from '@/app/pages/tree-types/tree-type.service';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { Roles, hasRole } from '@/app/constants/roles';
import { Nomenclature, NomenclatureStatus } from '@/app/models/nomenclature.model';

@Component({
    selector: 'app-nomenclatures',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        Textarea,
        SelectModule,
        ToggleSwitchModule,
        ConfirmDialogModule,
        TooltipModule,
        SkeletonModule,
        BackButtonComponent,
        TranslatePipe
    ],
    providers: [ConfirmationService],
    templateUrl: './nomenclatures.component.html',
    styleUrl: './nomenclatures.component.scss'
})
export class Nomenclatures implements OnInit {
    readonly service    = inject(NomenclatureService);
    readonly defService = inject(TreeTypeService);
    private auth      = inject(AuthService);
    private toast     = inject(ToastService);
    private confirm   = inject(ConfirmationService);
    private translate = inject(TranslateService);
    private router    = inject(Router);

    readonly canWrite = computed(() => hasRole(this.auth.currentUser()?.roles, Roles.ADMIN, Roles.CONTROLE_GESTION));
    readonly skeletonRows = Array(4).fill(true);

    // ── Filters ──────────────────────────────────────────────────────────────
    readonly showArchived = signal(false);
    get showArchivedModel(): boolean { return this.showArchived(); }
    set showArchivedModel(v: boolean) { this.showArchived.set(v); }

    statusFilter: NomenclatureStatus | null = null;
    readonly statusOptions: { label: string; value: NomenclatureStatus }[] = [
        { label: 'nom.status.DRAFT',    value: 'DRAFT' },
        { label: 'nom.status.FIXED',    value: 'FIXED' },
        { label: 'nom.status.ARCHIVED', value: 'ARCHIVED' }
    ];

    readonly visibleItems = computed(() => {
        let list = this.service.items();
        const sf = this.statusFilterSig();
        if (!this.showArchived() && sf !== 'ARCHIVED') list = list.filter((n) => n.status !== 'ARCHIVED');
        if (sf) list = list.filter((n) => n.status === sf);
        // Group versions of the same lineage together (by name, then lineage, oldest → newest).
        return [...list].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            || a.lineageId.localeCompare(b.lineageId)
            || a.version - b.version
        );
    });

    /** Whether the lineage has more than one version (→ show the version badge). */
    readonly multiVersionLineages = computed(() => {
        const count = new Map<string, number>();
        for (const n of this.service.items()) count.set(n.lineageId, (count.get(n.lineageId) ?? 0) + 1);
        return count;
    });
    hasVersions(n: Nomenclature): boolean {
        return (this.multiVersionLineages().get(n.lineageId) ?? 0) > 1;
    }
    // statusFilter bridged to a signal so the computed reacts.
    private readonly statusFilterSig = signal<NomenclatureStatus | null>(null);
    onStatusFilterChange(): void { this.statusFilterSig.set(this.statusFilter); }

    // ── Create dialog ────────────────────────────────────────────────────────
    readonly createOpen   = signal(false);
    readonly createSaving = signal(false);
    readonly fieldErrors  = signal<Record<string, string>>({});
    formName = '';
    formDescription = '';
    formDefinitionId: string | null = null;

    readonly definitionOptions = computed(() =>
        this.defService.activeTypes().map((d) => ({
            label: `${d.name} · ${d.depth} ${this.translate.instant('nom.levels_word')}`,
            value: d.id
        }))
    );

    ngOnInit(): void {
        this.service.ensureLoaded();
        this.defService.ensureLoaded();
    }

    openBuilder(n: Nomenclature): void {
        this.router.navigate(['/nomenclatures', n.id]);
    }

    // ── Create ───────────────────────────────────────────────────────────────
    openCreate(): void {
        this.formName = '';
        this.formDescription = '';
        this.formDefinitionId = null;
        this.fieldErrors.set({});
        this.createOpen.set(true);
    }

    get createValid(): boolean {
        const n = this.formName.trim();
        return n.length > 0 && n.length <= 255 && this.formDescription.length <= 500 && !!this.formDefinitionId;
    }

    saveCreate(): void {
        if (!this.createValid || this.createSaving()) return;
        this.createSaving.set(true);
        this.fieldErrors.set({});
        this.service.create({
            name: this.formName.trim(),
            description: this.formDescription.trim() || null,
            nomenclatureDefinitionId: this.formDefinitionId!
        }).subscribe({
            next: (created) => {
                this.createSaving.set(false);
                this.createOpen.set(false);
                this.toast.showSuccess(this.translate.instant('nom.created'));
                this.router.navigate(['/nomenclatures', created.id]);   // straight to the builder
            },
            error: (err) => {
                this.createSaving.set(false);
                if (err?.apiError?.code === 'VALIDATION_ERROR') this.fieldErrors.set(err.apiError.fieldErrors ?? {});
            }
        });
    }

    // ── Delete (DRAFT only) ──────────────────────────────────────────────────
    confirmDelete(n: Nomenclature): void {
        this.confirm.confirm({
            message: this.translate.instant('nom.confirm_delete', { name: n.name }),
            header:  this.translate.instant('nom.delete'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('nom.confirm_yes'), severity: 'danger' },
            rejectButtonProps: { label: this.translate.instant('nom.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.service.delete(n.id).subscribe({
                    next: () => this.toast.showSuccess(this.translate.instant('nom.deleted_ok'))
                });
            }
        });
    }
}
