/** Application-wide key/value settings (paramétrage). */
export interface AppSetting {
    key:       string;
    value:     string;
    updatedBy: string;
    updatedAt: string;
}

/** The one setting that drives the projects-feature vocabulary. */
export const TERMINOLOGY_KEY = 'project.terminology';
export type ProjectTerminology = 'PROJECT' | 'PROGRAM';

/** The four term forms fed to translate() params across the projects feature. */
export interface TermSet {
    singular:     string;
    singular_cap: string;
    plural:       string;
    plural_cap:   string;
}
