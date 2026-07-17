import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { FileService } from '@/app/services/file.service';
import { DocumentOutput } from '@/app/models/document.model';

/**
 * Generic document API client for any entity that owns file attachments.
 *
 * Endpoints follow the convention `{basePath}/{entityId}/documents[/{docId}]`,
 * e.g. basePath `/budgets` → `/api/v1/budgets/{id}/documents`. Auth (Bearer JWT)
 * is attached transparently by the auth interceptor to every call — including the
 * multipart upload and the blob download. Document operations skip the global
 * loading overlay ({@link SKIP_LOADING}); each component drives its own UI.
 */
@Injectable({ providedIn: 'root' })
export class DocumentService {
    private http        = inject(HttpClient);
    private fileService = inject(FileService);

    private documentsUrl(basePath: string, entityId: string): string {
        return `${environment.apiUrl}${basePath}/${entityId}/documents`;
    }

    private get context(): HttpContext {
        return new HttpContext().set(SKIP_LOADING, true);
    }

    /**
     * Upload 1..N files, optionally tied to a sub-scope and/or a docType.
     * Sends multipart/form-data — the Content-Type (with boundary) is set by the
     * browser; never set it manually or the boundary is lost.
     */
    uploadDocuments(
        basePath: string,
        entityId: string,
        files: File[],
        opts?: { scopeId?: string; docType?: string }
    ): Observable<DocumentOutput[]> {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        if (opts?.scopeId) fd.append('scopeId', opts.scopeId);
        if (opts?.docType) fd.append('docType', opts.docType);

        return this.http.post<DocumentOutput[]>(this.documentsUrl(basePath, entityId), fd, {
            context: this.context
        });
    }

    listDocuments(basePath: string, entityId: string): Observable<DocumentOutput[]> {
        return this.http.get<DocumentOutput[]>(this.documentsUrl(basePath, entityId), {
            context: this.context
        });
    }

    deleteDocument(basePath: string, entityId: string, documentId: string): Observable<void> {
        return this.http.delete<void>(`${this.documentsUrl(basePath, entityId)}/${documentId}`, {
            context: this.context
        });
    }

    /**
     * Open the document (PDF/image inline in a new tab, others downloaded) by id
     * through the entity's download endpoint — the backend streams it with
     * Content-Disposition; no path is sent or read.
     */
    downloadDocument(basePath: string, entityId: string, doc: DocumentOutput): Observable<void> {
        return this.fileService.openUrl(
            `${this.documentsUrl(basePath, entityId)}/${doc.id}/download`,
            doc.fileName,
            doc.contentType
        );
    }
}
