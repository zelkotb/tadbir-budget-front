const NOTIFICATION_PREFIX = '/notifications';

export const NOTIFICATION_LIST_PATH         = NOTIFICATION_PREFIX;
export const NOTIFICATION_UNREAD_COUNT_PATH = `${NOTIFICATION_PREFIX}/unread-count`;
export const NOTIFICATION_READ_ALL_PATH     = `${NOTIFICATION_PREFIX}/read-all`;
export const notificationReadPath           = (id: string) => `${NOTIFICATION_PREFIX}/${id}/read`;
