/** Generic workflow models (base `/api/v1/workflow`). Task assignees are uids. */

/** Payload sent when completing a task — free-form process variables. */
export interface CompleteTaskInput {
    variables: Record<string, unknown>;   // e.g. {} or { outcome: 'APPROVE' | 'RETURN' }
}

/** Item returned by GET /workflow/tasks/inbox (assigned + claimable for me). */
export interface WorkflowTask {
    id:          string;
    name:        string;
    assignee:    string | null;   // uid of the holder; null = claimable pool task
    businessKey: string;          // domain entity id the task is attached to
}

/** POST /workflow/instances */
export interface StartInstanceInput {
    processKey:  string;
    businessKey: string;
    variables?:  Record<string, unknown>;
}

/** A running/completed process instance (GET /workflow/instances). */
export interface WorkflowInstance {
    id:          string;
    processKey:  string;
    businessKey: string;
    startedAt:   string;
    endedAt:     string | null;
}

/** One step of the instance history (GET /workflow/instances/history). */
export interface WorkflowHistoryEntry {
    activityId: string;
    name:       string;
    assignee:   string | null;   // uid
    startTime:  string;
    endTime:    string | null;
}

/** A deployed process definition (GET /workflow/definitions). */
export interface ProcessDefinition {
    id:      string;
    key:     string;
    name:    string;
    version: number;
}
