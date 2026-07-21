/**
 * Budget "type d'arborescence" — a TEMPLATE of ordered levels for a chart of
 * accounts (e.g. Chapitre › Article › Paragraphe › Ligne). Holds no accounts;
 * it's pre-configuration the Nomenclature feature will build on.
 */
export interface TreeLevel {
    id:       string;
    position: number;   // 1..N, top-down; server-assigned
    name:     string;
    leaf:     boolean;  // exactly the last level is the leaf ("ligne budgétaire")
}

export interface TreeType {
    id:          string;
    name:        string;
    description: string | null;
    active:      boolean;
    depth:       number;         // = levels.length
    levels:      TreeLevel[];    // ordered by position
}

/** POST /budget/nomenclature-definitions — levels are just ordered names; server assigns 1..N. */
export interface CreateTreeTypeInput {
    name:         string;
    description?: string | null;
    levels:       string[];
}

/**
 * PATCH /budget/nomenclature-definitions/{id} — null/omitted = unchanged.
 * When `levels` is sent it REPLACES the whole ordered list.
 */
export interface UpdateTreeTypeInput {
    name?:        string;
    description?: string | null;
    active?:      boolean;
    levels?:      string[];
}
