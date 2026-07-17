const USER_PREFIX = '/user';

export const USER_CREATE_PATH   = USER_PREFIX;
export const USER_LIST_PATH     = USER_PREFIX;
export const USER_STAFF_PATH    = `${USER_PREFIX}/staff`;
export const USER_ME_PATH       = `${USER_PREFIX}/me`;
export const USER_AUDIT_PATH    = `${USER_PREFIX}/audit`;
export const userDetailPath     = (userId: string) => `${USER_PREFIX}/${userId}`;
export const userAuditDiffPath  = (revisionId: number) => `${USER_AUDIT_PATH}/${revisionId}/diff`;
export const userPasswordPath   = (userId: string) => `${USER_PREFIX}/${userId}/password`;
export const userEnablePath     = (userId: string) => `${USER_PREFIX}/${userId}/enable`;
export const userDisablePath    = (userId: string) => `${USER_PREFIX}/${userId}/disable`;
