import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Page } from '@/app/models/common.models';
import { AuditQuery, AuthAuditResponse } from './audit.models';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { AUTH_AUDIT_PATH } from './audit.paths';

@Injectable({ providedIn: 'root' })
export class AuditService {
    private http = inject(HttpClient);

    getAudit(query: AuditQuery): Observable<Page<AuthAuditResponse>> {
        let params = new HttpParams();
        if (query.email     != null) params = params.set('email',      query.email);
        if (query.ipAddress != null) params = params.set('ipAddress',  query.ipAddress);
        if (query.eventType != null) params = params.set('eventType',  query.eventType);
        if (query.success   != null) params = params.set('success',    String(query.success));
        if (query.date      != null) params = params.set('date',       query.date);
        if (query.page      != null) params = params.set('page',       String(query.page));
        if (query.size      != null) params = params.set('size',       String(query.size));
        if (query.sort      != null) params = params.set('sort',       query.sort);

        const context = new HttpContext().set(SKIP_LOADING, true);
        return this.http.get<Page<AuthAuditResponse>>(`${environment.apiUrl}${AUTH_AUDIT_PATH}`, { params, context });
    }
}
