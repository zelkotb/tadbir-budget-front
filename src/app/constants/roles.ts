/**
 * Authorities. ROLE_ADMIN is the technical role (user management, audit, workflow
 * deployment); the rest form the organisational hierarchy.
 */
export const Roles = {
    ADMIN:              'ROLE_ADMIN',
    EMPLOYEE:           'ROLE_EMPLOYEE',
    DEPARTMENT_MANAGER: 'ROLE_DEPARTMENT_MANAGER',
    DIRECTION_MANAGER:  'ROLE_DIRECTION_MANAGER',
    POLE_MANAGER:       'ROLE_POLE_MANAGER',
    DIRECTION_GENERALE: 'ROLE_DIRECTION_GENERALE'
} as const;

export type Role = typeof Roles[keyof typeof Roles];

/** Admin gate — the only hard-coded role check; everything admin-only keys off this. */
export const IS_ADMIN = (roles: string[]): boolean => roles.includes(Roles.ADMIN);

/** i18n key for a role label (with a humanized fallback if the key is missing). */
export const roleLabelKey = (role: string): string => `roles.${role}`;

/** Full set of roles that exist in the system (order = display order). */
export const ALL_ROLES = [
    'ROLE_ADMIN',
    'ROLE_EMPLOYEE',
    'ROLE_DEPARTMENT_MANAGER',
    'ROLE_DIRECTION_MANAGER',
    'ROLE_POLE_MANAGER',
    'ROLE_DIRECTION_GENERALE'
] as const;

/** Roles an admin can assign — the full set (admin is assignable to trusted operators). */
export const ASSIGNABLE_ROLES = ALL_ROLES;
