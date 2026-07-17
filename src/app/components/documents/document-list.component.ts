import { Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@/app/services/toast.service';
import { DocumentService } from '@/app/services/document.service';
import { DocumentOutput } from '@/app/models/document.model';
import { fileIcon, humanSize, uploadErrorKey } from '@/app/utils/file.util';

/**
 * Generic, flat list of an entity's documents with open (inline/download) and
 * optional delete. Endpoints resolve through {@link DocumentService} from
 * `basePath` + `entityId` (e.g. basePath '/budgets').
 */
@Component({
    selector: 'app-document-list',
    standalone: true,
    imports: [DatePipe, ButtonModule, TooltipModule, ConfirmPopupModule, TranslatePipe],
    providers: [ConfirmationService],
    templateUrl: './document-list.component.html'
})
export class DocumentList {
    private documentService = inject(DocumentService);
    private confirm         = inject(ConfirmationService);
    private toast           = inject(ToastService);
    private translate       = inject(TranslateService);

    /** Resource collection path, e.g. '/budgets'. */
    readonly basePath  = input.required<string>();
    readonly entityId  = input.required<string>();
    readonly documents = input<DocumentOutput[]>([]);
    readonly canDelete = input<boolean>(false);

    readonly deleted = output<string>();

    readonly downloadingId = signal<string | null>(null);
    readonly deletingId    = signal<string | null>(null);

    readonly humanSize = humanSize;
    readonly fileIcon  = fileIcon;

    /** Opens PDFs/images inline in a new tab, downloads other types — by document id. */
    open(doc: DocumentOutput): void {
        if (this.downloadingId()) return;
        this.downloadingId.set(doc.id);
        this.documentService.downloadDocument(this.basePath(), this.entityId(), doc).subscribe({
            next: () => this.downloadingId.set(null),
            error: (err: HttpErrorResponse) => {
                this.downloadingId.set(null);
                const key = err?.status === 404 ? 'document.err_not_found' : 'document.download_error';
                this.toast.showError(this.translate.instant(key));
            }
        });
    }

    confirmDelete(event: Event, doc: DocumentOutput): void {
        this.confirm.confirm({
            target: event.currentTarget as EventTarget,
            message: this.translate.instant('document.confirm_delete'),
            icon: 'pi pi-info-circle',
            acceptButtonProps: { label: this.translate.instant('document.confirm_yes'), severity: 'danger' },
            rejectButtonProps: { label: this.translate.instant('document.confirm_no'), outlined: true, severity: 'secondary' },
            accept: () => this.doDelete(doc)
        });
    }

    private doDelete(doc: DocumentOutput): void {
        this.deletingId.set(doc.id);
        this.documentService.deleteDocument(this.basePath(), this.entityId(), doc.id).subscribe({
            next: () => {
                this.deletingId.set(null);
                this.deleted.emit(doc.id);
                this.toast.showSuccess(this.translate.instant('document.delete_success'));
            },
            error: (err) => {
                this.deletingId.set(null);
                this.toast.showError(this.translate.instant(uploadErrorKey(err)));
            }
        });
    }
}
