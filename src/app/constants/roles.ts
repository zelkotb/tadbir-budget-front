/**
 * Authorities (plain strings; the JWT `roles` claim is the client-side source of
 * truth for nav/guards — the server still enforces via @PreAuthorize).
 *
 * ROLE_ADMIN is the technical role (user management, audit, workflow deployment).
 * ROLE_CONTROLE_GESTION is a functional role for the upcoming Budget administration
 * area (nomenclature, campaigns, freeze/validate); it can be held alongside any
 * hierarchy role. The remaining roles form the organisational hierarchy.
 */
export const Roles = {
    ADMIN:              'ROLE_ADMIN',
    CONTROLE_GESTION:   'ROLE_CONTROLE_GESTION',
    EMPLOYEE:           'ROLE_EMPLOYEE',
    DEPARTMENT_MANAGER: 'ROLE_DEPARTMENT_MANAGER',
    DIRECTION_MANAGER:  'ROLE_DIRECTION_MANAGER',
    POLE_MANAGER:       'ROLE_POLE_MANAGER',
    DIRECTION_GENERALE: 'ROLE_DIRECTION_GENERALE'
} as const;

export type Role = typeof Roles[keyof typeof Roles];

/**
 * Generic authority check — true when the user holds at least one of the required
 * roles. Safe for null/empty/unknown roles (never throws), so gating on a brand-new
 * authority can't crash a guard.
 */
export const hasRole = (roles: string[] | null | undefined, ...required: string[]): boolean =>
    (roles ?? []).some((r) => required.includes(r));

/** Admin gate — everything admin-only keys off this. */
export const IS_ADMIN = (roles: string[] | null | undefined): boolean => hasRole(roles, Roles.ADMIN);

/** Contrôle de gestion — foundation gate for the upcoming Budget administration area. */
export const IS_CONTROLE_GESTION = (roles: string[] | null | undefined): boolean =>
    hasRole(roles, Roles.CONTROLE_GESTION);

/** i18n key for a role label (with a humanized fallback if the key is missing). */
export const roleLabelKey = (role: string): string => `roles.${role}`;

/** Full set of roles that exist in the system (order = display order). */
export const ALL_ROLES = [
    'ROLE_ADMIN',
    'ROLE_CONTROLE_GESTION',
    'ROLE_EMPLOYEE',
    'ROLE_DEPARTMENT_MANAGER',
    'ROLE_DIRECTION_MANAGER',
    'ROLE_POLE_MANAGER',
    'ROLE_DIRECTION_GENERALE'
] as const;

/** Roles an admin can assign — the full set (admin is assignable to trusted operators). */
export const ASSIGNABLE_ROLES = ALL_ROLES;
