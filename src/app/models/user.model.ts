export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

/** GET /user, /user/{id}, /user/me, /user/staff — the user projection. */
export interface UserSummary {
    id:                  string;
    uid:                 string;
    fullName:            string;
    email:               string;
    phoneNumber:         string;
    roles:               string[];
    enabled:             boolean;
    failedLoginAttempts: number;
    managerId?:          string | null;   // hierarchy parent (N+1); null for none
}

/** POST /user */
export interface CreateUserInput {
    uid:         string;
    fullName:    string;
    phoneNumber: string;
    email:       string;
    password:    string;
    roles:       string[];
    managerId?:  string | null;
}

/**
 * PATCH /user/{id} — partial update; omitted fields are unchanged.
 * `roles` / `managerId` are applied only when the caller is admin.
 */
export interface UpdateUserInput {
    uid?:         string;
    email?:       string;
    fullName?:    string;
    phoneNumber?: string;
    roles?:       string[];
    managerId?:   string | null;
}

/** PUT /user/{id}/password — currentPassword required only when changing your own. */
export interface ChangePasswordInput {
    currentPassword?: string;
    newPassword:      string;
}

export interface UserListQuery {
    fullName?: string;
    email?:    string;
    uid?:      string;          // partial, case-insensitive
    enabled?:  boolean;
    roles?:    string[];        // repeatable
    page?:     number;
    size?:     number;
    sort?:     string;          // default 'fullName,asc'
}

// ── User change-history audit (GET /user/audit) ──────────────────────────────
export interface UserAuditResponse {
    revisionId:    number;
    occurredAt:    string;
    performedBy:   string;      // uid of the actor
    performedFrom: string;      // ip
    action:        AuditAction;
    userId:        string;
    uid:           string;
    fullName:      string;
    email:         string;
    phoneNumber:   string;
    roles:         string[];
    enabled:       boolean;
}

export interface FieldChange {
    field:  string;
    before: unknown;
    after:  unknown;
}

/** GET /user/audit/{revisionId}/diff */
export interface UserAuditDiff {
    revisionId:    number;
    occurredAt:    string;
    performedBy:   string;
    performedFrom: string;
    action:        AuditAction;
    userId:        string;
    userUid:       string;
    userFullName:  string;
    changes:       FieldChange[];
}

export interface UserAuditQuery {
    performedBy?: string;       // uid, partial
    ip?:          string;
    action?:      AuditAction;
    userId?:      string;
    date?:        string;       // DD/MM/YYYY
    page?:        number;
    size?:        number;
    sort?:        string;
}
