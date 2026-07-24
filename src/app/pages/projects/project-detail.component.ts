import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { ToastService } from '@/app/services/toast.service';
import { ProjectService } from '@/app/pages/projects/project.service';
import { SettingsService } from '@/app/services/settings.service';
import { Project } from '@/app/models/project.model';

/**
 * Project detail — metadata + team, with lifecycle actions (edit, terminate,
 * archive, delete) gated on {@link ProjectService.canWriteProject} and status.
 * Create/edit live on the dedicated routed form; team is edited there too.
 */
@Component({
    selector: 'app-project-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        ButtonModule,
        DialogModule,
        InputNumberModule,
        DatePickerModule,
        ConfirmDialogModule,
        TooltipModule,
        SkeletonModule,
        BackButtonComponent,
        TranslatePipe
    ],
    providers: [ConfirmationService],
    templateUrl: './project-detail.component.html',
    styleUrl: './project-detail.component.scss'
})
export class ProjectDetail implements OnInit {
    readonly service  = inject(ProjectService);
    readonly settings = inject(SettingsService);
    private toast     = inject(ToastService);
    private confirm   = inject(ConfirmationService);
    private translate = inject(TranslateService);
    private route     = inject(ActivatedRoute);
    private router    = inject(Router);

    private id = this.route.snapshot.paramMap.get('id')!;

    readonly project  = signal<Project | null>(null);
    readonly loading  = signal(true);
    readonly notFound = signal(false);
    readonly busy     = signal(false);

    readonly canWrite    = computed(() => { const p = this.project(); return !!p && this.service.canWriteProject(p); });
    readonly isActive    = computed(() => this.project()?.status === 'ACTIVE');
    readonly isArchived  = computed(() => this.project()?.status === 'ARCHIVED');
    readonly isNotStarted = computed(() => this.project()?.status === 'NOT_STARTED');
    /** Show "Démarrer" only for the chef or a manager-in-scope, on a NOT_STARTED project. */
    readonly canStart    = computed(() => { const p = this.project(); return !!p && p.status === 'NOT_STARTED' && this.service.canStartProject(p); });

    /** First letter of a name for avatars. */
    initial(name: string | null | undefined): string {
        return (name || '?').trim().charAt(0).toUpperCase() || '?';
    }

    /**
     * Splits the free-text objectifs into an intro (non-bulleted lines) and a
     * bullet list (lines starting with -, •, 🎯, ✅, … — the marker is stripped).
     */
    readonly objectifs = computed<{ intro: string[]; bullets: string[] }>(() => {
        const lines = (this.project()?.objectifs ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const marker = /^\s*([-*•·–—▪●►▶➤◦]|🎯|✅|✔[️]?|☑[️]?)\s*/u;
        const intro: string[] = [];
        const bullets: string[] = [];
        for (const line of lines) {
            if (marker.test(line)) bullets.push(line.replace(marker, '').trim());
            else intro.push(line);
        }
        return { intro, bullets };
    });

    /** Lifecycle timeline steps (reached state from status; dates degrade to "—"). */
    readonly lifecycle = computed(() => {
        const p = this.project();
        if (!p) return [];
        const started    = p.status === 'ACTIVE' || p.status === 'TERMINATED' || p.status === 'ARCHIVED';
        const terminated = p.status === 'TERMINATED' || p.status === 'ARCHIVED';
        const archived   = p.status === 'ARCHIVED';
        return [
            { labelKey: 'projects.lifecycle.created',    date: p.createdAt,          text: null as string | null, tooltip: p.createdBy, reached: true },
            { labelKey: 'projects.lifecycle.started',    date: p.startDate ?? null,  text: null as string | null, tooltip: null,        reached: started },
            { labelKey: 'projects.lifecycle.terminated', date: p.terminatedAt ?? null,
              text: (!p.terminatedAt && p.terminationYear) ? String(p.terminationYear) : null, tooltip: null, reached: terminated },
            { labelKey: 'projects.lifecycle.archived',   date: p.archivedAt ?? null, text: null as string | null, tooltip: null,        reached: archived }
        ];
    });

    ngOnInit(): void {
        this.service.ensureMe();
        this.reload();
    }

    private reload(): void {
        this.loading.set(true);
        this.service.getOne(this.id).pipe(catchError(() => of(null))).subscribe((p) => {
            this.loading.set(false);
            if (!p) { this.notFound.set(true); return; }
            this.project.set(p);
        });
    }

    statusPill(s: string): string { return `pj-status pj-status-${s}`; }

    goEdit(): void { this.router.navigate(['/projets', this.id, 'modifier']); }

    // ── Start dialog ─────────────────────────────────────────────────────────
    readonly startOpen = signal(false);
    startDate: Date = new Date();

    openStart(): void {
        this.startDate = new Date();
        this.startOpen.set(true);
    }
    confirmStart(): void {
        const p = this.project();
        if (!p || this.busy()) return;
        this.busy.set(true);
        this.service.start(p.id, this.startDate ? this.toIsoDate(this.startDate) : null).subscribe({
            next: (updated) => {
                this.busy.set(false);
                this.startOpen.set(false);
                this.project.set(updated);
                this.toast.showSuccess(this.translate.instant('projects.started_ok', this.settings.terms()));
            },
            error: () => this.busy.set(false)   // PROJECT_INVALID_STATUS / ACCESS_DENIED toast via interceptor
        });
    }
    private toIsoDate(d: Date): string {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    }

    // ── Terminate dialog ─────────────────────────────────────────────────────
    readonly terminateOpen = signal(false);
    terminateYear = new Date().getFullYear();

    openTerminate(): void {
        this.terminateYear = new Date().getFullYear();
        this.terminateOpen.set(true);
    }
    confirmTerminate(): void {
        const p = this.project();
        if (!p || !this.terminateYear) return;
        this.busy.set(true);
        this.service.terminate(p.id, this.terminateYear).subscribe({
            next: (updated) => {
                this.busy.set(false);
                this.terminateOpen.set(false);
                this.project.set(updated);
                this.toast.showSuccess(this.translate.instant('projects.terminated_ok', this.settings.terms()));
            },
            error: () => this.busy.set(false)   // PROJECT_INVALID_STATUS toast via interceptor
        });
    }

    // ── Archive / delete ─────────────────────────────────────────────────────
    confirmArchive(): void {
        const p = this.project();
        if (!p) return;
        this.confirm.confirm({
            message: this.translate.instant('projects.confirm_archive', { name: p.name, ...this.settings.terms() }),
            header:  this.translate.instant('projects.archive'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('projects.archive'), severity: 'warn' },
            rejectButtonProps: { label: this.translate.instant('projects.cancel'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.busy.set(true);
                this.service.archive(p.id).subscribe({
                    next: (updated) => { this.busy.set(false); this.project.set(updated); this.toast.showSuccess(this.translate.instant('projects.archived_ok', this.settings.terms())); },
                    error: () => this.busy.set(false)
                });
            }
        });
    }
    confirmDelete(): void {
        const p = this.project();
        if (!p) return;
        this.confirm.confirm({
            message: this.translate.instant('projects.confirm_delete', { name: p.name, ...this.settings.terms() }),
            header:  this.translate.instant('projects.delete'),
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: this.translate.instant('projects.confirm_yes'), severity: 'danger' },
            rejectButtonProps: { label: this.translate.instant('projects.cancel'), outlined: true, severity: 'secondary' },
            accept: () => {
                this.service.delete(p.id).subscribe({
                    next: () => { this.toast.showSuccess(this.translate.instant('projects.deleted_ok', this.settings.terms())); this.router.navigate(['/projects']); }
                });
            }
        });
    }
}
