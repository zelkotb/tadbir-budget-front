/** Known notification grouping tags. Unknown values fall back to a default icon. */
export type NotificationCategory =
    | 'WORKFLOW_STEP_ASSIGNED'
    | 'WORKFLOW_REQUEST_PROGRESS'
    | 'WORKFLOW_REQUEST_COMPLETED';

/** A single notification row as returned by GET /notifications. */
export interface NotificationView {
    id:           string;
    /** One of {@link NotificationCategory} — kept as `string` to tolerate unknown values. */
    category:     string;
    referenceKey: string | null;
    subject:      string;
    /** Plain text — must be rendered as text, never as HTML. */
    body:         string;
    read:         boolean;
    createdAt:    string;        // ISO-8601
    readAt:       string | null;
}

/** GET /notifications/unread-count response. */
export interface UnreadCountResult {
    count: number;
}

/** POST /notifications/read-all response. */
export interface MarkAllReadResult {
    marked: number;
}
