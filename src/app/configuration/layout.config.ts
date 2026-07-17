export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    menuMode: string;
}

export const defaultLayoutConfig: LayoutConfig = {
    preset: 'Aura',
    primary: 'emerald',
    surface: 'slate',
    menuMode: 'static'
};

/** Maps a Tailwind/PrimeNG color name to its full semantic scale for definePreset / updatePreset. */
export function buildPrimaryScale(name: string): Record<number, string> {
    return Object.fromEntries(
        [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, `{${name}.${s}}`])
    );
}

import { surfaces } from './theme.config';

/**
 * Returns the surface palette for use in colorScheme.light/dark.surface.
 * Returns null when name is null/undefined so callers can skip the override.
 */
export function buildSurfaceScale(name: string | null | undefined): Record<number, string> | null {
    if (!name) return null;
    const found = surfaces.find((s) => s.name === name);
    return (found?.palette as Record<number, string>) ?? null;
}