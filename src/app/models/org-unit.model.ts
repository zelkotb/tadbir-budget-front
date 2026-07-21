import { TreeNode } from 'primeng/api';

/**
 * Organisational unit (GET /org-units). `kind` is a free label — POLE | DIRECTION |
 * DEPARTEMENT | SERVICE are the expected values but unknown kinds must render as-is.
 * There is NO `code` field.
 */
export interface OrgUnit {
    id:              string;
    name:            string;
    kind:            string;
    parentId:        string | null;   // null = root unit
    managerId:       string | null;
    managerFullName: string | null;   // unit's responsible; null = none assigned
    path:            string;
    depth:           number;
    active:          boolean;         // false = archived (soft)
}

/** POST /org-units */
export interface CreateOrgUnitInput {
    name:       string;
    kind:       string;
    parentId?:  string | null;   // omit/null = new root unit
    managerId?: string | null;
}

/**
 * PATCH /org-units/{id} — null/omitted = unchanged.
 * `moveToRoot` is exclusive with `parentId`; `clearManager` removes the responsible.
 */
export interface UpdateOrgUnitInput {
    name?:         string;
    kind?:         string;
    active?:       boolean;
    parentId?:     string;
    moveToRoot?:   boolean;
    managerId?:    string;
    clearManager?: boolean;
}

/** GET /org-units/{id}/users — a member of the unit (or its subtree). */
export interface OrgUnitMember {
    id:        string;
    uid:       string;
    fullName:  string;
    email:     string;
    roles:     string[];
    orgUnitId: string;
}

/** Known kinds → p-tag severity (undefined = primary). Unknown kinds fall back to secondary. */
export const KIND_SEVERITY: Record<string, 'info' | 'success' | 'warn' | 'secondary' | 'contrast' | undefined> = {
    PDG:         'contrast',
    DGD:         'info',
    POLE:        undefined,      // primary (default p-tag color)
    DIRECTION:   'info',
    DIVISION:    'success',
    DEPARTEMENT: 'success',
    SERVICE:     'warn'
};

/** The suggested kinds (free entry stays allowed in the form). */
export const KNOWN_KINDS = ['PDG', 'DGD', 'POLE', 'DIRECTION', 'DIVISION', 'DEPARTEMENT', 'SERVICE'] as const;

// ─── Tree helpers (pure — shared by the chart, treeselects, and user pages) ────

export interface OrgTreeOptions {
    /** Include archived (active=false) units. Default false. */
    includeArchived?: boolean;
    /** Ids rendered as non-selectable (e.g. the moved node + its subtree). */
    disabledIds?: Set<string>;
}

/**
 * Builds PrimeNG TreeNode[] from the flat list (parent-before-child ordered).
 * Roots = parentId null OR parent not present in the (filtered) list — so a unit
 * whose parent is filtered out (archived) still shows instead of vanishing.
 */
export function buildOrgTree(units: OrgUnit[], opts: OrgTreeOptions = {}): TreeNode<OrgUnit>[] {
    const visible = opts.includeArchived ? units : units.filter((u) => u.active);
    const nodes = new Map<string, TreeNode<OrgUnit>>();
    const roots: TreeNode<OrgUnit>[] = [];

    for (const unit of visible) {
        const node: TreeNode<OrgUnit> = {
            key:        unit.id,
            label:      unit.name,
            data:       unit,
            expanded:   true,
            selectable: !opts.disabledIds?.has(unit.id),
            children:   []
        };
        nodes.set(unit.id, node);
        const parent = unit.parentId ? nodes.get(unit.parentId) : undefined;
        if (parent) parent.children!.push(node);
        else roots.push(node);
    }
    return roots;
}

/** The unit's id + all descendant ids (client-side ORG_UNIT_CYCLE guard). */
export function subtreeIds(units: OrgUnit[], rootId: string): Set<string> {
    const childrenOf = new Map<string | null, OrgUnit[]>();
    for (const u of units) {
        const list = childrenOf.get(u.parentId) ?? [];
        list.push(u);
        childrenOf.set(u.parentId, list);
    }
    const ids = new Set<string>();
    const stack = [rootId];
    while (stack.length) {
        const id = stack.pop()!;
        if (ids.has(id)) continue;
        ids.add(id);
        for (const child of childrenOf.get(id) ?? []) stack.push(child.id);
    }
    return ids;
}

/** Depth-first search for a node by unit id (used to map id ⇄ TreeNode for p-treeselect). */
export function findNodeById(nodes: TreeNode<OrgUnit>[], id: string | null | undefined): TreeNode<OrgUnit> | null {
    if (!id) return null;
    for (const node of nodes) {
        if (node.key === id) return node;
        const hit = findNodeById(node.children ?? [], id);
        if (hit) return hit;
    }
    return null;
}
