/**
 * Central category → visual mapping for notifications. The row icon tile, the
 * colored tag, the "À valider" filter, and any accent all read from here — never
 * inline per item. Extend the branches as backend categories grow.
 */

export type NotifTone = 'val' | 'ok' | 'rej' | 'info' | 'neutral';

export interface NotifVisual {
    /** Drives the icon-tile + tag color classes (i-/t- prefixes in SCSS). */
    tone:           NotifTone;
    /** PrimeNG icon class for the tile. */
    icon:           string;
    /** i18n key for the tag label, or null to fall back to a humanized category. */
    tagKey:         string | null;
    /** True for the action set surfaced by the "À valider" filter. */
    requiresAction: boolean;
}

const VAL:     Omit<NotifVisual, 'tagKey'> = { tone: 'val',     icon: 'pi pi-flag',          requiresAction: true  };
const OK:      Omit<NotifVisual, 'tagKey'> = { tone: 'ok',      icon: 'pi pi-check-circle',  requiresAction: false };
const REJ:     Omit<NotifVisual, 'tagKey'> = { tone: 'rej',     icon: 'pi pi-times-circle',  requiresAction: false };
const INFO:    Omit<NotifVisual, 'tagKey'> = { tone: 'info',    icon: 'pi pi-file',          requiresAction: false };
const PROGRESS:Omit<NotifVisual, 'tagKey'> = { tone: 'info',    icon: 'pi pi-sync',          requiresAction: false };
const NEUTRAL: Omit<NotifVisual, 'tagKey'> = { tone: 'neutral', icon: 'pi pi-bell',          requiresAction: false };

/** Resolves the visual identity for a notification category. */
export function notifVisual(category: string): NotifVisual {
    const c = (category ?? '').toUpperCase();

    if (c.startsWith('WORKFLOW_')) {
        if (/(ASSIGN|TO_VALIDATE|PENDING|AWAIT|ACTION|REVIEW)/.test(c)) return { ...VAL, tagKey: 'notifications.tag.to_validate' };
        if (/(APPROV|FAVORABLE|ACCEPT|VALIDATED|COMPLETED|SUCCESS)/.test(c)) return { ...OK, tagKey: 'notifications.tag.favorable' };
        if (/(REJECT|RETURN|REFUS|UNFAVOR|DEFAVOR|DENIED)/.test(c))      return { ...REJ, tagKey: 'notifications.tag.unfavorable' };
        return { ...PROGRESS, tagKey: 'notifications.tag.workflow' };
    }

    if (c.startsWith('DOCUMENT_'))   return { ...INFO, tagKey: 'notifications.tag.document' };
    if (c.startsWith('SUBMISSION_')) return { ...INFO, tagKey: 'notifications.tag.submission' };

    return { ...NEUTRAL, tagKey: null };
}

/** Whether a category belongs to the action set (drives the "À valider" tab). */
export function requiresAction(category: string): boolean {
    return notifVisual(category).requiresAction;
}

/** "WORKFLOW_REQUEST_PROGRESS" → "Workflow request progress" (neutral tag fallback). */
export function humanizeCategory(category: string): string {
    if (!category) return '';
    const words = category.replace(/_/g, ' ').toLowerCase().trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
}
