import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TreeNode } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TreeSelectModule } from 'primeng/treeselect';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslatePipe } from '@ngx-translate/core';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { ProjectService } from '@/app/pages/projects/project.service';
import { OrgUnitService } from '@/app/pages/organigramme/org-unit.service';
import { SettingsService } from '@/app/services/settings.service';
import { OrgUnit } from '@/app/models/org-unit.model';
import { Project, ProjectStatus } from '@/app/models/project.model';

/**
 * Projects list — scoped server-side; visible to any authenticated user. Create
 * is gated on {@link ProjectService.canCreate} and routes to the dedicated form.
 * Poseidon-styled.
 */
@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        SelectModule,
        TreeSelectModule,
        TooltipModule,
        SkeletonModule,
        BackButtonComponent,
        TranslatePipe
    ],
    templateUrl: './projects.component.html',
    styleUrl: './projects.component.scss'
})
export class Projects implements OnInit {
    readonly service    = inject(ProjectService);
    readonly orgService = inject(OrgUnitService);
    readonly settings   = inject(SettingsService);
    private router      = inject(Router);

    readonly skeletonRows = Array(5).fill(true);

    // ── Filters ──────────────────────────────────────────────────────────────
    readonly statusFilter = signal<ProjectStatus | null>(null);
    readonly orgFilterId  = signal<string | null>(null);
    orgFilterNode: TreeNode<OrgUnit> | null = null;

    get statusModel(): ProjectStatus | null { return this.statusFilter(); }
    set statusModel(v: ProjectStatus | null) { this.statusFilter.set(v); }
    onOrgFilterChange(): void { this.orgFilterId.set(this.orgFilterNode?.data?.id ?? null); }

    readonly statusOptions: { label: string; value: ProjectStatus }[] = [
        { label: 'projects.status.NOT_STARTED', value: 'NOT_STARTED' },
        { label: 'projects.status.ACTIVE',      value: 'ACTIVE' },
        { label: 'projects.status.TERMINATED',  value: 'TERMINATED' },
        { label: 'projects.status.ARCHIVED',    value: 'ARCHIVED' }
    ];

    readonly visibleItems = computed(() => {
        const sf = this.statusFilter(), of_ = this.orgFilterId();
        return this.service.items().filter((p) =>
            (!sf || p.status === sf) && (!of_ || p.orgUnitId === of_)
        );
    });

    ngOnInit(): void {
        this.service.ensureLoaded();
        this.service.ensureMe();
        this.orgService.ensureLoaded();
    }

    openDetail(p: Project): void { this.router.navigate(['/projects', p.id]); }
    goCreate(): void { this.router.navigate(['/projets/nouveau']); }

    statusPill(s: ProjectStatus): string { return `pj-status pj-status-${s}`; }
}
