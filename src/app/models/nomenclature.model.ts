/**
 * A "nomenclature" is the REAL tree of rubriques built from a définition de
 * nomenclature (the level template). Deepest level = leaf ("ligne budgétaire").
 * Lifecycle: DRAFT (build) → FIXED (published/usable) → ARCHIVED (read-only).
 * FIXED is NOT frozen — rubriques may still be added/renamed/deleted; only
 * ARCHIVED is read-only. Versioning: a FIXED nomenclature can be cloned into a
 * new DRAFT of the same lineage (same name, incremented `version`).
 */
export type NomenclatureStatus = 'DRAFT' | 'FIXED' | 'ARCHIVED';

export interface NomenclatureLevel {
    id:       string;
    position: number;
    name:     string;
    leaf:     boolean;
}

export interface Nomenclature {
    id:                       string;
    name:                     string;
    description:              string | null;
    status:                   NomenclatureStatus;
    nomenclatureDefinitionId: string;
    definitionName:           string;
    depth:                    number;
    levels:                   NomenclatureLevel[];
    rubriqueCount:            number;
    fixedAt:                  string | null;
    fixedBy:                  string | null;
    // ── Versioning ──
    version:                  number;
    lineageId:                string;
    previousVersionId:        string | null;
}

/** A node of the tree. `levelName` / `leaf` come from the server — never sent on write. */
export interface Rubrique {
    id:             string;
    nomenclatureId: string;
    parentId:       string | null;
    levelPosition:  number;
    levelName:      string;
    code:           string;
    label:          string;
    leaf:           boolean;
}

export interface CreateNomenclatureInput {
    name:                     string;
    description?:             string | null;
    nomenclatureDefinitionId: string;
}
export interface UpdateNomenclatureInput {
    name?:        string;
    description?: string | null;
}

/** parentId null = top level; the server decides levelPosition + leaf. */
export interface CreateRubriqueInput {
    parentId?: string | null;
    code:      string;
    label:     string;
}
export interface UpdateRubriqueInput {
    code?:  string;
    label?: string;
}

/**
 * A rubrique-node → org-unit grant (FIXED nomenclatures only). The grant flows
 * DOWNWARD: the whole subtree under `rubriqueId` becomes usable by `orgUnitId`
 * and every org unit below it.
 */
export interface RubriqueAssignment {
    id:            string;
    rubriqueId:    string;
    rubriqueCode:  string;
    rubriqueLabel: string;
    levelPosition: number;
    levelName:     string;
    leaf:          boolean;
    orgUnitId:     string;
    orgUnitName:   string;
    assignedBy:    string;
    assignedAt:    string;
}
export interface CreateAssignmentInput {
    rubriqueId: string;
    orgUnitId:  string;
}

// ─── Display helpers (severities only — no hardcoded colors) ───────────────────
export const STATUS_SEVERITY: Record<NomenclatureStatus, 'info' | 'success' | 'secondary'> = {
    DRAFT:    'info',
    FIXED:    'success',
    ARCHIVED: 'secondary'
};

export type TagSeverity = 'contrast' | 'info' | 'warn' | 'success' | 'secondary';
const LEVEL_SEVERITIES: readonly TagSeverity[] = ['contrast', 'info', 'warn', 'success', 'secondary'];
/** Level position (1..N) → a p-tag severity, cycled for deep templates. */
export function levelSeverity(position: number): TagSeverity {
    return LEVEL_SEVERITIES[(Math.max(1, position) - 1) % LEVEL_SEVERITIES.length];
}

// ─── Tree helpers ──────────────────────────────────────────────────────────────
export interface RubriqueNode {
    data:     Rubrique;
    children: RubriqueNode[];
}

/** Builds a rubrique tree from the flat list; siblings ordered by code. */
export function buildRubriqueTree(rubriques: Rubrique[]): RubriqueNode[] {
    const byParent = new Map<string | null, Rubrique[]>();
    for (const r of rubriques) {
        const list = byParent.get(r.parentId) ?? [];
        list.push(r);
        byParent.set(r.parentId, list);
    }
    for (const list of byParent.values()) {
        list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
    }
    const build = (parentId: string | null): RubriqueNode[] =>
        (byParent.get(parentId) ?? []).map((r) => ({ data: r, children: build(r.id) }));
    return build(null);
}

/** True when another rubrique has this one as parent (client-side delete guard). */
export function rubriqueHasChildren(rubriques: Rubrique[], id: string): boolean {
    return rubriques.some((r) => r.parentId === id);
}
