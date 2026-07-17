/** Generic workflow-task models (base `/api/v1/workflow/tasks`). */

/** Payload sent when completing a task — free-form process variables. */
export interface CompleteTaskInput {
    variables: Record<string, unknown>;   // e.g. {} or { outcome: 'APPROVE' | 'RETURN' }
}

/** Item returned by GET /workflow/tasks/inbox (assigned + claimable for me). */
export interface WorkflowTask {
    id:          string;
    name:        string;
    assignee:    string | null;
    businessKey: string;          // domain entity id the task is attached to
}
