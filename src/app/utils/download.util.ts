import { HttpResponse } from '@angular/common/http';

/**
 * Extract a filename from a Content-Disposition header, else the fallback.
 * Handles both `filename="x.xlsx"` and RFC 5987 `filename*=UTF-8''x.xlsx`.
 */
export function filenameFromContentDisposition(header: string | null, fallback: string): string {
    if (!header) return fallback;
    const star = /filename\*=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    if (star?.[1]) {
        try { return decodeURIComponent(star[1]); } catch { /* fall through to plain form */ }
    }
    const plain = /filename="?([^";]+)"?/i.exec(header);
    return plain?.[1] ?? fallback;
}

/** Trigger a browser download for a Blob via a temporary object URL. */
export function saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Save a blob HTTP response (e.g. an .xlsx export), preferring the server-provided
 * filename from Content-Disposition and falling back to `fallbackName`.
 */
export function saveBlobResponse(response: HttpResponse<Blob>, fallbackName: string): void {
    if (!response.body) return;
    saveBlob(response.body, filenameFromContentDisposition(response.headers.get('Content-Disposition'), fallbackName));
}
