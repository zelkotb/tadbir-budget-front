import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { SKIP_GLOBAL_ERROR } from '@/app/interceptors/error.interceptor';
import { CompleteTaskInput, WorkflowTask } from '@/app/models/workflow.model';

const TASKS_PATH    = '/workflow/tasks';
const claimPath     = (taskId: string) => `${TASKS_PATH}/${taskId}/claim`;
const unclaimPath   = (taskId: string) => `${TASKS_PATH}/${taskId}/unclaim`;
const reassignPath  = (taskId: string) => `${TASKS_PATH}/${taskId}/reassign`;
const completePath  = (taskId: string) => `${TASKS_PATH}/${taskId}/complete`;
const INBOX_PATH    = `${TASKS_PATH}/inbox`;

/**
 * Generic workflow task operations (base /api/v1/workflow/tasks).
 *
 * Mutations (claim / complete) opt out of the global error interceptor via
 * {@link SKIP_GLOBAL_ERROR}: the calling component shows the toast AND reloads
 * its view on stale-state codes (the "your view moved on" recovery), and must
 * not be force-redirected on ACCESS_DENIED. Calls use only the opaque task id.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowService {
    private http = inject(HttpClient);

    private get actionContext(): HttpContext {
        return new HttpContext().set(SKIP_GLOBAL_ERROR, true);
    }

    /** Claim a pooled (unassigned) task. */
    claim(taskId: string): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}${claimPath(taskId)}`, {}, { context: this.actionContext });
    }

    /**
     * Releases an assigned task back to the pool. The holder may release their
     * own task; an admin may release anyone's. A 403 means it's not yours and
     * you're not admin.
     */
    unclaim(taskId: string): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}${unclaimPath(taskId)}`, {}, { context: this.actionContext });
    }

    /**
     * Admin-only: reassigns an active task to another user. A 403 (ACCESS_DENIED)
     * means the chosen user lacks the role the current step requires.
     */
    reassign(taskId: string, userId: string): Observable<void> {
        const params = new HttpParams().set('userId', userId);
        return this.http.post<void>(`${environment.apiUrl}${reassignPath(taskId)}`, {}, { params, context: this.actionContext });
    }

    /** Completes the active task, advancing the workflow. */
    complete(taskId: string, body: CompleteTaskInput): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}${completePath(taskId)}`, body, { context: this.actionContext });
    }

    /** My inbox: assigned + claimable tasks, each carrying its businessKey (entity id). */
    inbox(): Observable<WorkflowTask[]> {
        return this.http.get<WorkflowTask[]>(`${environment.apiUrl}${INBOX_PATH}`, {
            context: new HttpContext().set(SKIP_LOADING, true)
        });
    }
}
