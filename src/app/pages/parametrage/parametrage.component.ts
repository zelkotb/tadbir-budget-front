import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BackButtonComponent } from '@/app/components/back-button/back-button.component';
import { ToastService } from '@/app/services/toast.service';
import { SettingsService } from '@/app/services/settings.service';
import { ProjectTerminology, TERMINOLOGY_KEY } from '@/app/models/settings.model';

/**
 * Paramétrage — admin settings screen. Lists app settings; the
 * `project.terminology` setting is editable via a Projet/Programme select (PUT).
 */
@Component({
    selector: 'app-parametrage',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe, SelectModule, SkeletonModule, TranslatePipe, BackButtonComponent],
    templateUrl: './parametrage.component.html',
    styleUrl: './parametrage.component.scss'
})
export class Parametrage implements OnInit {
    readonly settings = inject(SettingsService);
    private toast     = inject(ToastService);
    private translate = inject(TranslateService);

    readonly saving = signal(false);

    readonly terminologyOptions: { label: string; value: ProjectTerminology }[] = [
        { label: 'parametrage.term_project', value: 'PROJECT' },
        { label: 'parametrage.term_program', value: 'PROGRAM' }
    ];

    /** The terminology setting record (for updatedBy / updatedAt), if loaded. */
    readonly terminologySetting = computed(() =>
        this.settings.settings().find((s) => s.key === TERMINOLOGY_KEY) ?? null
    );
    /** Any other settings, shown read-only. */
    readonly otherSettings = computed(() =>
        this.settings.settings().filter((s) => s.key !== TERMINOLOGY_KEY)
    );

    ngOnInit(): void {
        this.settings.load();
    }

    saveTerminology(value: ProjectTerminology): void {
        if (this.saving() || value === this.settings.terminology()) return;
        this.saving.set(true);
        this.settings.update(TERMINOLOGY_KEY, value).subscribe({
            next: () => { this.saving.set(false); this.toast.showSuccess(this.translate.instant('parametrage.saved_ok')); },
            error: () => this.saving.set(false)   // SETTING_INVALID_VALUE / SETTING_NOT_FOUND toast via interceptor
        });
    }
}
