export type AuthEventType = 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH';

export interface AuthAuditResponse {
    id:          number;
    email:       string;
    eventType:   AuthEventType;
    success:     boolean;
    ipAddress:   string;
    userAgent:   string;
    occurredAt:  string;
}

export interface AuditQuery {
    email?:      string;
    ipAddress?:  string;
    eventType?:  AuthEventType;
    success?:    boolean;
    /** Partial date in DD/MM/YYYY format — any prefix works (e.g. "04/06/2026", "04/06/", "04/0") */
    date?:       string;
    page?:       number;
    size?:       number;
    sort?:       string;
}
