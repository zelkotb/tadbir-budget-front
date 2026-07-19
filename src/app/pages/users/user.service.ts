import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Page } from '@/app/models/common.models';
import { CreateUserInput, UpdateUserInput, ChangePasswordInput, UserAuditResponse, UserAuditDiff, UserAuditQuery, UserSummary, UserListQuery } from '@/app/models/user.model';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { USER_CREATE_PATH, USER_LIST_PATH, USER_STAFF_PATH, USER_ME_PATH, USER_AUDIT_PATH, userPasswordPath, userEnablePath, userDisablePath, userAuditDiffPath, userDetailPath } from './user.paths';

@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);

    getUsers(query: UserListQuery = {}): Observable<Page<UserSummary>> {
        let params = new HttpParams();
        if (query.fullName != null) params = params.set('fullName', query.fullName);
        if (query.email    != null) params = params.set('email',    query.email);
        if (query.uid      != null) params = params.set('uid',      query.uid);
        if (query.enabled  != null) params = params.set('enabled',  String(query.enabled));
        if (query.roles    != null) for (const role of query.roles) params = params.append('roles', role);
        if (query.page     != null) params = params.set('page',     String(query.page));
        if (query.size     != null) params = params.set('size',     String(query.size));
        if (query.sort     != null) params = params.set('sort',     query.sort);

        const context = new HttpContext().set(SKIP_LOADING, true);
        return this.http.get<Page<UserSummary>>(`${environment.apiUrl}${USER_LIST_PATH}`, { params, context });
    }

    getUser(userId: string): Observable<UserSummary> {
        const context = new HttpContext().set(SKIP_LOADING, true);
        return this.http.get<UserSummary>(`${environment.apiUrl}${userDetailPath(userId)}`, { context });
    }

    /** All users — manager (N+1) candidates for the hierarchy picker. */
    getStaff(): Observable<UserSummary[]> {
        const context = new HttpContext().set(SKIP_LOADING, true);
        return this.http.get<UserSummary[]>(`${environment.apiUrl}${USER_STAFF_PATH}`, { context });
    }

    getMe(): Observable<UserSummary> {
        const context = new HttpContext().set(SKIP_LOADING, true);
        return this.http.get<UserSummary>(`${environment.apiUrl}${USER_ME_PATH}`, { context });
    }

    createUser(input: CreateUserInput): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}${USER_CREATE_PATH}`, input);
    }

    updateUser(userId: string, input: UpdateUserInput): Observable<void> {
        return this.http.patch<void>(`${environment.apiUrl}${userDetailPath(userId)}`, input);
    }

    enableUser(userId: string): Observable<void> {
        return this.http.put<void>(`${environment.apiUrl}${userEnablePath(userId)}`, null);
    }

    disableUser(userId: string): Observable<void> {
        return this.http.put<void>(`${environment.apiUrl}${userDisablePath(userId)}`, null);
    }

    changePassword(userId: string, input: ChangePasswordInput): Observable<void> {
        return this.http.put<void>(`${environment.apiUrl}${userPasswordPath(userId)}`, input);
    }

    getUserAudit(query: UserAuditQuery): Observable<Page<UserAuditResponse>> {
        let params = new HttpParams();
        if (query.performedBy != null) params = params.set('performedBy', query.performedBy);
        if (query.ip          != null) params = params.set('ip',          query.ip);
        if (query.action      != null) params = params.set('action',      query.action);
        if (query.userId      != null) params = params.set('userId',      query.userId);
        if (query.date        != null) params = params.set('date',        query.date);
        if (query.page        != null) params = params.set('page',        String(query.page));
        if (query.size        != null) params = params.set('size',        String(query.size));
        if (query.sort        != null) params = params.set('sort',        query.sort);

        const context = new HttpContext().set(SKIP_LOADING, true);
        return this.http.get<Page<UserAuditResponse>>(`${environment.apiUrl}${USER_AUDIT_PATH}`, { params, context });
    }

    getUserAuditDiff(revisionId: number): Observable<UserAuditDiff> {
        const context = new HttpContext().set(SKIP_LOADING, true);
        return this.http.get<UserAuditDiff>(`${environment.apiUrl}${userAuditDiffPath(revisionId)}`, { context });
    }
}
