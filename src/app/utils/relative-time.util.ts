/**
 * Compact, locale-aware relative timestamp for notification rows.
 *
 * Examples (fr): "à l'instant", "5 min", "2 h", "hier", "3 j", "14/06/2026".
 * Falls back to an absolute date for anything older than a week.
 *
 * @param iso  ISO-8601 timestamp (e.g. NotificationView.createdAt).
 * @param lang Active language code ('fr' | 'ar'); anything else is treated as 'fr'.
 */
export function relativeTime(iso: string, lang: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';

    const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
    const min = Math.floor(sec / 60);
    const hr  = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    const ar  = lang === 'ar';

    if (sec < 60)  return ar ? 'الآن'        : "à l'instant";
    if (min < 60)  return ar ? `${min} د`    : `${min} min`;
    if (hr  < 24)  return ar ? `${hr} س`     : `${hr} h`;
    if (day === 1) return ar ? 'أمس'         : 'hier';
    if (day < 7)   return ar ? `${day} أيام` : `${day} j`;

    return new Date(iso).toLocaleDateString(ar ? 'ar-MA' : 'fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

/**
 * Humanized, compact duration from milliseconds — e.g. "2 h 15 min", "45 min",
 * "30 s", "< 1 s". Used for the workflow-journey step durations.
 */
export function humanizeDuration(ms: number | null | undefined, lang: string): string {
    if (ms == null || ms < 0) return '—';
    const ar = lang === 'ar';
    const u = ar
        ? { d: 'ي', h: 'س', m: 'د', s: 'ث', lt: '< 1 ث' }
        : { d: 'j', h: 'h', m: 'min', s: 's', lt: '< 1 s' };

    const sec = Math.floor(ms / 1000);
    if (sec < 1) return u.lt;
    const days = Math.floor(sec / 86400);
    const hrs  = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;

    const parts: string[] = [];
    if (days) parts.push(`${days} ${u.d}`);
    if (hrs)  parts.push(`${hrs} ${u.h}`);
    if (mins && !days) parts.push(`${mins} ${u.m}`);
    if (secs && !days && !hrs) parts.push(`${secs} ${u.s}`);
    return parts.slice(0, 2).join(' ') || u.lt;
}

export type DayBucket = 'today' | 'yesterday' | 'week' | 'older';

/**
 * Buckets a timestamp by calendar day relative to now, for the notification
 * panel's sticky day headers: Aujourd'hui / Hier / Cette semaine / Plus ancien.
 */
export function dayBucket(iso: string): DayBucket {
    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return 'older';

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const dayMs    = 86_400_000;
    const diffDays = Math.floor((startOfToday.getTime() - new Date(then).setHours(0, 0, 0, 0)) / dayMs);

    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7)   return 'week';
    return 'older';
}
