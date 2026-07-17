import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ToastService } from '@/app/services/toast.service';
import { DocumentService } from '@/app/services/document.service';
import { DOC_TYPES, DocumentOutput, FILE_ALLOWED_EXT } from '@/app/models/document.model';
import { fileIcon, humanSize, uploadErrorKey, validateFile } from '@/app/utils/file.util';

interface RejectedFile {
    name: string;
    reasonKey: string;
}

/**
 * Reusable multi-file picker with client-side validation.
 *
 * Two modes:
 *  - upload mode (default): a "Téléverser" button uploads the staged files to
 *    `{basePath}/{entityId}/documents` (optionally scoped to `scopeId` / `docType`)
 *    and emits the returned {@link DocumentOutput}[] via `uploaded`.
 *  - staging mode (`stageOnly`): no upload happens; the validated File[] is emitted
 *    via `filesStaged` for the parent to upload later (used by a create wizard
 *    before the entity — and its id — exists).
 */
@Component({
    selector: 'app-document-uploader',
    standalone: true,
    imports: [FormsModule, ButtonModule, SelectModule, TranslatePipe],
    templateUrl: './document-uploader.component.html',
    styleUrl: './document-uploader.component.scss'
})
export class DocumentUploader implements OnInit {
    private documentService = inject(DocumentService);
    private toast           = inject(ToastService);
    private translate       = inject(TranslateService);

    // ── Inputs ────────────────────────────────────────────────────────────────
    /** Resource collection path, e.g. '/budgets'. Required in upload mode. */
    readonly basePath     = input<string>('');
    readonly entityId     = input<string | undefined>(undefined);
    readonly scopeId      = input<string | undefined>(undefined);
    readonly docType      = input<string | undefined>(undefined);
    readonly disabled     = input<boolean>(false);
    readonly stageOnly    = input<boolean>(false);
    /** Seeds the pending list on init — used to restore staged files when the host re-renders. */
    readonly initialFiles = input<File[]>([]);

    // ── Outputs ───────────────────────────────────────────────────────────────
    readonly uploaded    = output<DocumentOutput[]>();
    readonly filesStaged = output<File[]>();

    // ── State ─────────────────────────────────────────────────────────────────
    readonly pending     = signal<File[]>([]);
    readonly rejected    = signal<RejectedFile[]>([]);
    readonly uploading   = signal(false);
    readonly dragOver    = signal(false);
    readonly errorKey    = signal<string>('');

    selectedDocType: string | null = null;

    readonly acceptAttr     = FILE_ALLOWED_EXT.map((e) => `.${e}`).join(',');
    readonly docTypeOptions = DOC_TYPES.map((t) => ({ label: `document.type.${t}`, value: t }));

    // ── Helpers exposed to the template ──────────────────────────────────────
    readonly humanSize = humanSize;
    readonly fileIcon  = fileIcon;

    ngOnInit(): void {
        this.selectedDocType = this.docType() ?? null;
        if (this.initialFiles().length) this.pending.set([...this.initialFiles()]);
    }

    // ── File selection ──────────────────────────────────────────────────────
    onBrowse(input: HTMLInputElement): void {
        this.addFiles(input.files);
        input.value = '';   // allow re-selecting the same file
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragOver.set(false);
        if (this.disabled()) return;
        this.addFiles(event.dataTransfer?.files ?? null);
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        if (!this.disabled()) this.dragOver.set(true);
    }

    onDragLeave(): void {
        this.dragOver.set(false);
    }

    private addFiles(list: FileList | null): void {
        if (!list || list.length === 0) return;
        this.errorKey.set('');

        const valid: File[] = [...this.pending()];
        const rejected: RejectedFile[] = [];

        for (const file of Array.from(list)) {
            // Skip exact duplicates already pending.
            if (valid.some((f) => f.name === file.name && f.size === file.size)) continue;
            const check = validateFile(file);
            if (check.ok) valid.push(file);
            else rejected.push({ name: file.name, reasonKey: check.reasonKey! });
        }

        this.pending.set(valid);
        this.rejected.set(rejected);
        if (this.stageOnly()) this.filesStaged.emit(valid);
    }

    removePending(index: number): void {
        const next = this.pending().filter((_, i) => i !== index);
        this.pending.set(next);
        if (this.stageOnly()) this.filesStaged.emit(next);
    }

    dismissRejected(): void {
        this.rejected.set([]);
    }

    // ── Upload ────────────────────────────────────────────────────────────────
    upload(): void {
        const id = this.entityId();
        const files = this.pending();
        if (!id || !this.basePath() || files.length === 0 || this.uploading()) return;

        this.uploading.set(true);
        this.errorKey.set('');

        this.documentService.uploadDocuments(this.basePath(), id, files, {
            scopeId: this.scopeId(),
            docType: this.selectedDocType ?? undefined
        }).subscribe({
            next: (docs) => {
                this.uploading.set(false);
                this.pending.set([]);
                this.rejected.set([]);
                this.uploaded.emit(docs);
                this.toast.showSuccess(this.translate.instant('document.upload_success'));
            },
            error: (err) => {
                this.uploading.set(false);
                const key = uploadErrorKey(err);
                this.errorKey.set(key);
                this.toast.showError(this.translate.instant(key));
            }
        });
    }
}
