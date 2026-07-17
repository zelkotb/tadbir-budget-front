/**
 * Post-login landing route. Every authenticated user can reach `/account`
 * (their own profile); point this at a role-specific home once the app has one.
 */
export const DEFAULT_ROUTE = '/account';

/** Role-aware post-login landing. Currently uniform; branch by role when needed. */
export function homeRouteFor(_roles: string[]): string {
    return DEFAULT_ROUTE;
}
