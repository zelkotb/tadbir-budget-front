export interface Language {
    code: string;
    label: string;
    flag: string;
    direction: 'ltr' | 'rtl';
}

export const languages: Language[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷', direction: 'ltr' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦', direction: 'rtl' }
];

export const defaultLanguage = 'fr';