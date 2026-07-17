import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { Page } from '@/app/models/common.models';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { MarkAllReadResult, NotificationView, UnreadCountResult } from './notification.model';
import {
    NOTIFICATION_LIST_PATH,
    NOTIFICATION_READ_ALL_PATH,
    NOTIFICATION_UNREAD_COUNT_PATH,
    notificationReadPath
} from './notification.paths';

/** Backend caps page size at 100. */
const MAX_PAGE_SIZE = 100;

/**
 * API client for in-app notifications.
 *
 * Authentication is handled transparently by {@link authInterceptor}
 * (Bearer JWT). All calls opt out of the global loading overlay via
 * {@link SKIP_LOADING} so the topbar bell never blocks the UI.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
    private http = inject(HttpClient);

    private get context(): HttpContext {
        return new HttpContext().set(SKIP_LOADING, true);
    }

    /**
     * Newest-first page of notifications. Only `page` and `size` are sent —
     * the backend already orders newest-first, so no `sort` param is passed.
     */
    getNotifications(page: number, size: number): Observable<Page<NotificationView>> {
        const params = new HttpParams()
            .set('page', String(Math.max(0, page)))
            .set('size', String(Math.min(Math.max(1, size), MAX_PAGE_SIZE)));
        return this.http.get<Page<NotificationView>>(
            `${environment.apiUrl}${NOTIFICATION_LIST_PATH}`,
            { params, context: this.context }
        );
    }

    /** Unread-only count — the single source of truth for the badge. */
    getUnreadCount(): Observable<number> {
        return this.http
            .get<UnreadCountResult>(`${environment.apiUrl}${NOTIFICATION_UNREAD_COUNT_PATH}`, { context: this.context })
            .pipe(map((res) => res.count));
    }

    /** Marks a single notification as read (204 No Content). */
    markRead(id: string): Observable<void> {
        return this.http.post<void>(
            `${environment.apiUrl}${notificationReadPath(id)}`,
            null,
            { context: this.context }
        );
    }

    /** Marks every unread notification as read; resolves to the number marked. */
    markAllRead(): Observable<number> {
        return this.http
            .post<MarkAllReadResult>(`${environment.apiUrl}${NOTIFICATION_READ_ALL_PATH}`, null, { context: this.context })
            .pipe(map((res) => res.marked));
    }
}
