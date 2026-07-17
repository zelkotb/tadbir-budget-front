export const Roles = {
    ADMIN:             'ROLE_ADMIN',
    USER:              'ROLE_USER',
    INSTRUCTOR:        'ROLE_INSTRUCTOR',
    VALIDATOR:         'ROLE_VALIDATOR',
    COMMISSION:        'ROLE_COMMISSION',
    MEMBRE_COMMISSION: 'ROLE_MEMBRE_COMMISSION',
    MANAGEMENT:        'ROLE_MANAGEMENT'
} as const;

export type Role = typeof Roles[keyof typeof Roles];

export const IS_ADMIN = (roles: string[]): boolean => roles.includes(Roles.ADMIN);

/**
 * "Management / Direction" — a read-only viewer. It can open every read screen
 * (lists, detail, history, dashboards) but sees no action controls.
 */
export const IS_MANAGEMENT = (roles: string[]): boolean => roles.includes(Roles.MANAGEMENT);

/** Admin or management — the audience for the people/agent analytics tab. */
export const IS_ADMIN_OR_MANAGEMENT = (roles: string[]): boolean =>
    IS_ADMIN(roles) || IS_MANAGEMENT(roles);

/**
 * Core roles with hard-coded behavior. ROLE_MANAGEMENT is a read-only viewer, so
 * it is explicitly NOT a validator. Everything outside this set is a validator role.
 * ROLE_USER is the only non-staff (citizen) role.
 */
const CORE_ROLES: string[] = [Roles.ADMIN, Roles.USER, Roles.INSTRUCTOR, Roles.MANAGEMENT];

/**
 * "Staff" = anyone who handles the instruction work-queue rather than filing their
 * own requests — i.e. any role other than the citizen ROLE_USER (instructor,
 * validator, commission, management, admin). Generic so a new role is staff for free.
 */
export const IS_STAFF = (roles: string[]): boolean =>
    roles.some((r) => r !== Roles.USER);

/**
 * "Workflow viewer" — anyone allowed to see the instruction work-queue and its
 * map / analytics, i.e. every role except the citizen ROLE_USER. Same audience as
 * {@link IS_STAFF}; named separately to read intent at the map call sites.
 */
export const IS_WORKFLOW_VIEWER = IS_STAFF;

/**
 * A "validator" is any role outside the core set: validateur, commission, membre
 * de commission … Validators decide a dossier (validate / return). ROLE_MANAGEMENT
 * is core (read-only), so it never counts as a validator.
 */
export const IS_VALIDATOR = (roles: string[]): boolean =>
    roles.some((r) => !CORE_ROLES.includes(r));

/** i18n key for a role label (with a humanized fallback if the key is missing). */
export const roleLabelKey = (role: string): string => `roles.${role}`;

/** Roles an admin can assign — staff only, never ROLE_USER (citizens self-register). */
export const ASSIGNABLE_ROLES = [
    'ROLE_ADMIN', 'ROLE_INSTRUCTOR', 'ROLE_VALIDATOR', 'ROLE_COMMISSION', 'ROLE_MEMBRE_COMMISSION', 'ROLE_MANAGEMENT'
] as const;

/** Full set of roles that exist in the system. */
export const ALL_ROLES = [
    'ROLE_ADMIN', 'ROLE_INSTRUCTOR', 'ROLE_VALIDATOR', 'ROLE_COMMISSION', 'ROLE_MEMBRE_COMMISSION', 'ROLE_MANAGEMENT', 'ROLE_USER'
] as const;
