export type StatutJuridique = 'ENTREPRISE' | 'PERSONNE_PHYSIQUE';
export type AuditAction     = 'CREATE' | 'UPDATE' | 'DELETE';

export interface UserSummary {
    id:              string;
    fullName:        string;
    email:           string;
    cin:             string;
    phoneNumber:     string;
    address:         string;
    statutJuridique: StatutJuridique;
    enabled:         boolean;
    failedAttempts:  number;
    roles:           string[];
    managerId?:      string | null;   // hierarchy parent (a staff user); null for none
}

export interface CreateUserInput {
    fullName:        string;
    cin:             string;
    phoneNumber:     string;
    email:           string;
    address:         string;
    statutJuridique: StatutJuridique;
    password:        string;
    roles:           string[];
    managerId?:      string | null;   // optional staff manager
}

export interface UpdateUserInput {
    fullName:        string;
    cin:             string;
    phoneNumber:     string;
    email:           string;
    address:         string;
    statutJuridique: StatutJuridique;
    roles:           string[];
    managerId?:      string | null;   // optional staff manager
}

export interface ChangePasswordInput {
    currentPassword?: string;
    newPassword:      string;
}

export interface UserAuditResponse {
    revisionId:      number;
    occurredAt:      string;
    performedBy:     string;
    performedFrom:   string;
    action:          AuditAction;
    userId:          string;
    email:           string;
    fullName:        string;
    cin:             string;
    phoneNumber:     string;
    address:         string;
    statutJuridique: StatutJuridique;
    enabled:         boolean;
    roles:           string[];
}

export interface UserListQuery {
    fullName?:        string;
    email?:           string;
    cin?:             string;
    statutJuridique?: StatutJuridique;
    enabled?:         boolean;
    roles?:           string[];
    page?:            number;
    size?:            number;
    sort?:            string;
}

export interface FieldChange {
    field:  string;
    before: unknown;
    after:  unknown;
}

export interface UserAuditDiff {
    revisionId:    number;
    occurredAt:    string;
    performedBy:   string;
    performedFrom: string;
    action:        AuditAction;
    userId:        string;
    userEmail:     string;
    userFullName:  string;
    changes:       FieldChange[];
}

export interface UserAuditQuery {
    performedBy?: string;
    ip?:          string;
    action?:      AuditAction;
    userEmail?:   string;
    date?:        string;
    page?:        number;
    size?:        number;
    sort?:        string;
}
