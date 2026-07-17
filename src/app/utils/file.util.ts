import { FILE_ALLOWED_EXT, FILE_MAX_BYTES } from '@/app/models/document.model';

/** Lower-cased extension (without the dot), or '' when none. */
export function fileExt(name: string): string {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

/** Human-readable size in French units (o / Ko / Mo). */
export function humanSize(bytes: number | null | undefined): string {
    if (bytes == null) return '—';
    if (bytes < 1024) return `${bytes} o`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} Ko`;
    const mb = kb / 1024;
    return `${mb.toFixed(mb < 10 ? 1 : 0)} Mo`;
}

/** PrimeIcons class for a file, chosen by its extension. */
export function fileIcon(fileName: string): string {
    const ext = fileExt(fileName);
    if (ext === 'pdf') return 'pi pi-file-pdf';
    if (ext === 'doc' || ext === 'docx') return 'pi pi-file-word';
    if (ext === 'xls' || ext === 'xlsx') return 'pi pi-file-excel';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'pi pi-image';
    return 'pi pi-file';
}

export interface FileValidation {
    ok: boolean;
    reasonKey?: string;   // i18n key when invalid
}

/** Mirror of the server validation: extension allow-list, non-empty, ≤ 10 MB. */
export function validateFile(file: File): FileValidation {
    if (!FILE_ALLOWED_EXT.includes(fileExt(file.name))) return { ok: false, reasonKey: 'document.err_type' };
    if (file.size === 0)                                return { ok: false, reasonKey: 'document.err_empty' };
    if (file.size > FILE_MAX_BYTES)                     return { ok: false, reasonKey: 'document.err_too_large' };
    return { ok: true };
}

/** Maps an API error to a user-facing i18n key. */
export function uploadErrorKey(err: { status?: number; apiError?: { code?: string } } | null | undefined): string {
    switch (err?.apiError?.code) {
        case 'FILE_TOO_LARGE':        return 'document.err_too_large';
        case 'FILE_TYPE_NOT_ALLOWED': return 'document.err_type';
        case 'FILE_EMPTY':            return 'document.err_empty';
        case 'RESOURCE_NOT_FOUND':    return 'document.err_not_found';
        default:                      return 'document.err_generic';
    }
}
