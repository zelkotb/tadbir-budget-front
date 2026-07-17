/**
 * Generic file-attachment models — reusable across any entity that owns documents.
 *
 * The backend owns storage paths; the client never sees a filesystem path and
 * always downloads by document id through the owning entity's endpoint
 * (`{basePath}/{entityId}/documents/{docId}/download`).
 */
export interface DocumentOutput {
    id:          string;
    /** Optional sub-scope inside the entity (e.g. a line item); null = attached to the entity as a whole. */
    scopeId:     string | null;
    /** Optional, app-defined category (see {@link DOC_TYPES}). */
    docType:     string | null;
    fileName:    string;            // original filename (display + download name)
    contentType: string | null;
    sizeBytes:   number | null;
    uploadedAt:  string;            // ISO instant
}

// ── Client-side validation (mirror the server). Tune per project. ─────────────
export const FILE_MAX_BYTES = 10 * 1024 * 1024;                                  // 10 MB
export const FILE_ALLOWED_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'];

/**
 * Optional document categories. Empty by default — populate per project to enable
 * the "type" selector in the uploader and the type label in the list. Provide an
 * i18n label per value under `document.type.<VALUE>`.
 */
export const DOC_TYPES: readonly string[] = [];
