import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { SKIP_LOADING } from '@/app/interceptors/loading.interceptor';
import { SKIP_GLOBAL_ERROR } from '@/app/interceptors/error.interceptor';
import {
    CompleteTaskInput,
    ProcessDefinition,
    StartInstanceInput,
    WorkflowHistoryEntry,
    WorkflowInstance,
    WorkflowTask
} from '@/app/models/workflow.model';

const WF          = '/workflow';
const INSTANCES   = `${WF}/instances`;
const HISTORY     = `${WF}/instances/history`;
const TASKS       = `${WF}/tasks`;
const INBOX       = `${TASKS}/inbox`;
const DEFINITIONS = `${WF}/definitions`;

/**
 * Generic workflow client (base /api/v1/workflow). Any authenticated role may
 * read/act on tasks; definition management is admin-only. Task assignees are
 * identified by **uid**; `reassign` takes the target user's UUID.
 *
 * Task mutations (claim / complete / …) opt out of the global error interceptor
 * via {@link SKIP_GLOBAL_ERROR} so the calling component can toast AND reload its
 * view on stale-state codes, and not be force-redirected on ACCESS_DENIED.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowService {
    private http = inject(HttpClient);

    private get actionContext(): HttpContext {
        return new HttpContext().set(SKIP_GLOBAL_ERROR, true);
    }
    private get silent(): HttpContext {
        return new HttpContext().set(SKIP_LOADING, true);
    }

    // ── Instances ───────────────────────────────────────────────────────────
    /** Start a process instance bound to a domain entity (businessKey). */
    startInstance(input: StartInstanceInput): Observable<WorkflowInstance> {
        return this.http.post<WorkflowInstance>(`${environment.apiUrl}${INSTANCES}`, input, { context: this.actionContext });
    }

    /** Active instances for a business key. */
    getInstances(businessKey: string): Observable<WorkflowInstance[]> {
        const params = new HttpParams().set('businessKey', businessKey);
        return this.http.get<WorkflowInstance[]>(`${environment.apiUrl}${INSTANCES}`, { params, context: this.silent });
    }

    /** Full step history for a business key. */
    getInstanceHistory(businessKey: string): Observable<WorkflowHistoryEntry[]> {
        const params = new HttpParams().set('businessKey', businessKey);
        return this.http.get<WorkflowHistoryEntry[]>(`${environment.apiUrl}${HISTORY}`, { params, context: this.silent });
    }

    // ── Tasks ───────────────────────────────────────────────────────────────
    /** My inbox: assigned + claimable tasks, each carrying its businessKey. */
    inbox(): Observable<WorkflowTask[]> {
        return this.http.get<WorkflowTask[]>(`${environment.apiUrl}${INBOX}`, { context: this.silent });
    }

    /** Claim a pooled (unassigned) task. */
    claim(taskId: string): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}${TASKS}/${taskId}/claim`, {}, { context: this.actionContext });
    }

    /** Release an assigned task back to the pool. */
    unclaim(taskId: string): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}${TASKS}/${taskId}/unclaim`, {}, { context: this.actionContext });
    }

    /** Complete the active task, advancing the workflow. */
    complete(taskId: string, body: CompleteTaskInput): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}${TASKS}/${taskId}/complete`, body, { context: this.actionContext });
    }

    /** Admin-only: reassign an active task to another user (by UUID). */
    reassign(taskId: string, userId: string): Observable<void> {
        const params = new HttpParams().set('userId', userId);
        return this.http.post<void>(`${environment.apiUrl}${TASKS}/${taskId}/reassign`, {}, { params, context: this.actionContext });
    }

    // ── Definitions (admin) ─────────────────────────────────────────────────
    listDefinitions(): Observable<ProcessDefinition[]> {
        return this.http.get<ProcessDefinition[]>(`${environment.apiUrl}${DEFINITIONS}`, { context: this.silent });
    }

    /** Deploy a new definition version (BPMN payload owned by the caller). */
    createDefinition(payload: unknown): Observable<ProcessDefinition> {
        return this.http.post<ProcessDefinition>(`${environment.apiUrl}${DEFINITIONS}`, payload);
    }

    getVersions(key: string): Observable<ProcessDefinition[]> {
        return this.http.get<ProcessDefinition[]>(`${environment.apiUrl}${DEFINITIONS}/${key}/versions`, { context: this.silent });
    }

    /** Raw BPMN XML for a definition id. */
    getBpmn(id: string): Observable<string> {
        return this.http.get(`${environment.apiUrl}${DEFINITIONS}/${id}/bpmn`, {
            responseType: 'text',
            context: this.silent
        });
    }
}
