import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';

/** Extensions that browsers can render inline, mapped to the MIME used to force inline display. */
const INLINE_EXT_MIME: Record<string, string> = {
    pdf:  'application/pdf',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    gif:  'image/gif',
    webp: 'image/webp',
    bmp:  'image/bmp',
    svg:  'image/svg+xml'
};

/**
 * Generic, app-wide file presenter.
 *
 * The backend owns storage paths — files are fetched from their own authenticated
 * download endpoint (by id) as a blob (so the Bearer header is sent by
 * {@link authInterceptor}), then either opened inline (PDF/image) in a new tab or
 * downloaded. Callers pass the absolute endpoint URL; no file path is ever read.
 *
 * Operations skip the global loading overlay; callers drive their own UI.
 */
@Injectable({ providedIn: 'root' })
export class FileService {
    private http = inject(HttpClient);

    /** Fetch an authenticated download URL and open inline (PDF/image) or save. */
    openUrl(url: string, fileName: string, contentType?: string | null): Observable<void> {
        return this.fetchBlob(url).pipe(
            tap((blob) => this.present(blob, fileName, contentType)),
            map(() => void 0)
        );
    }

    /** Fetch an authenticated download URL and always save to disk. */
    downloadUrl(url: string, fileName: string): Observable<void> {
        return this.fetchBlob(url).pipe(
            tap((blob) => this.save(blob, fileName)),
            map(() => void 0)
        );
    }

    private fetchBlob(url: string): Observable<Blob> {
        return this.http.get(url, {
            responseType: 'blob',
            context: new HttpContext().set(SKIP_LOADING, true)
        });
    }

    private present(blob: Blob, fileName: string, contentType?: string | null): void {
        const inlineType = this.inlineMime(fileName, contentType);
        if (!inlineType) {
            this.save(blob, fileName);
            return;
        }

        // Re-wrap with the resolved MIME so the browser renders it inline instead of downloading.
        const typed = new Blob([blob], { type: inlineType });
        const url = URL.createObjectURL(typed);
        const win = window.open(url, '_blank');
        if (!win) {
            // Popup blocked → fall back to a download.
            this.save(typed, fileName);
            URL.revokeObjectURL(url);
            return;
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    /** Inline MIME for PDFs/images, or null when the file should be downloaded. */
    private inlineMime(fileName: string, contentType?: string | null): string | null {
        const ct = (contentType ?? '').toLowerCase();
        if (ct === 'application/pdf' || ct.startsWith('image/')) return ct;
        const i = fileName.lastIndexOf('.');
        const ext = i >= 0 ? fileName.slice(i + 1).toLowerCase() : '';
        return INLINE_EXT_MIME[ext] ?? null;
    }

    private save(blob: Blob, fileName: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}
