/**
 * A project belongs to one org unit, has a chef de projet and a team, and a
 * lifecycle ACTIVE → TERMINATED → ARCHIVED. Users (chef + team) are referenced by
 * their `id` (NOT uid). There is no project code and no per-project type — the
 * whole feature is labelled "projet" or "programme" via the global terminology
 * setting (see SettingsService), not per record.
 */
export type ProjectStatus = 'NOT_STARTED' | 'ACTIVE' | 'TERMINATED' | 'ARCHIVED';

/** A team member as returned on GET /{id}. */
export interface ProjectTeamMember {
    userId:        string;
    uid:           string;
    fullName:      string;
    functionLabel: string;
}

export interface Project {
    id:              string;
    name:            string;
    objectifs:       string | null;
    description:     string | null;
    status:          ProjectStatus;
    chefProjetId:    string;
    chefProjetName:  string;
    orgUnitId:       string;
    orgUnitName:     string;
    terminationYear: number | null;
    createdBy:       string;
    createdAt:       string;
    // Lifecycle timestamps (optional — rendered as "—" when the backend omits them).
    startDate?:      string | null;
    terminatedAt?:   string | null;
    archivedAt?:     string | null;
    memberCount:     number;
    /** Filled on GET /{id}; null in the list. */
    team:            ProjectTeamMember[] | null;
}

/** A team row on write — userId + optional function label. */
export interface TeamMemberInput {
    userId:         string;
    functionLabel?: string | null;
}

export interface CreateProjectInput {
    name:         string;
    objectifs?:   string | null;
    description?: string | null;
    chefProjetId: string;
    orgUnitId:    string;
    team?:        TeamMemberInput[];
}

/** POST /{id}/start — optional date (server defaults to today when omitted). */
export interface StartProjectInput {
    startDate?: string | null;   // YYYY-MM-DD
}

/** PATCH — org unit is NOT editable after creation. */
export interface UpdateProjectInput {
    name?:         string;
    objectifs?:    string | null;
    description?:  string | null;
    chefProjetId?: string;
}

export interface ProjectListQuery {
    status?:    ProjectStatus;
    orgUnitId?: string;
}

// ─── Display helpers (severities only — no hardcoded colors) ───────────────────
export const PROJECT_STATUS_SEVERITY: Record<ProjectStatus, 'success' | 'warn' | 'secondary' | 'info'> = {
    NOT_STARTED: 'secondary',
    ACTIVE:      'success',
    TERMINATED:  'info',
    ARCHIVED:    'secondary'
};
