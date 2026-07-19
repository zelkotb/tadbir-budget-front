import { ApiErrorCode, FieldErrorCode } from '@/app/models/api-error.model';

// ─── Supported languages ──────────────────────────────────────────────────────

/**
 * Languages with a dedicated error-message map.
 * Other locales (e.g. 'en') fall back to French.
 */
export type SupportedLang = 'ar' | 'fr';

type ErrorMessageMap = Record<ApiErrorCode | FieldErrorCode, string>;

// ─── i18n map ─────────────────────────────────────────────────────────────────

const messages: Record<SupportedLang, ErrorMessageMap> = {

    // ── Arabic (RTL) ──────────────────────────────────────────────────────────
    ar: {
        // AUTH / USER
        UID_ALREADY_EXISTS:     'اسم المستخدم مستعمل مسبقاً.',
        EMAIL_ALREADY_EXISTS:   'هذا البريد الإلكتروني مسجل مسبقاً.',
        INVALID_CREDENTIALS:    'اسم المستخدم أو كلمة المرور غير صحيحة.',
        ACCOUNT_DISABLED:       'تم تعطيل حسابك. يرجى التواصل مع الدعم.',
        USER_NOT_FOUND:         'الحساب غير موجود.',
        // REFRESH TOKEN
        REFRESH_TOKEN_MISSING:  'انتهت جلستك. يرجى تسجيل الدخول مجدداً.',
        REFRESH_TOKEN_INVALID:  'جلسة غير صالحة. يرجى تسجيل الدخول مجدداً.',
        REFRESH_TOKEN_REVOKED:  'تم إنهاء جلستك. يرجى تسجيل الدخول مجدداً.',
        REFRESH_TOKEN_EXPIRED:  'انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.',
        // INPUT
        VALIDATION_ERROR:       'يرجى تصحيح الحقول المُشار إليها.',
        INVALID_REQUEST_BODY:   'تعذّر قراءة الطلب. يرجى المحاولة مجدداً.',
        // HTTP
        ACCESS_DENIED:          'ليس لديك صلاحية للقيام بهذا الإجراء.',
        RESOURCE_NOT_FOUND:     'المورد المطلوب غير موجود.',
        METHOD_NOT_ALLOWED:     'هذا الإجراء غير مسموح به.',
        RATE_LIMIT_EXCEEDED:    'طلبات كثيرة جداً، يرجى الانتظار قبل المحاولة مجدداً.',
        // FILES
        FILE_TOO_LARGE:           'الملف كبير جداً (10 ميغابايت كحد أقصى).',
        FILE_TYPE_NOT_ALLOWED:    'نوع الملف غير مسموح به.',
        FILE_EMPTY:               'الملف فارغ.',
        FILE_NOT_FOUND:           'الملف غير موجود أو تمت إزالته.',
        // GENERIC
        INTERNAL_ERROR:         'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.',
        // FIELD-LEVEL
        REQUIRED:               'هذا الحقل مطلوب.',
        INVALID_EMAIL:          'يرجى إدخال بريد إلكتروني صالح.',
        INVALID_SIZE:           'القيمة قصيرة أو طويلة جداً.',
        INVALID_FORMAT:         'الصيغة غير صالحة.',
        OUT_OF_RANGE:           'القيمة خارج النطاق المسموح به.',
        MUST_BE_POSITIVE:       'يجب أن تكون القيمة موجبة.',
        MUST_BE_FUTURE:         'يجب أن يكون التاريخ في المستقبل.',
        MUST_BE_PAST:           'يجب أن يكون التاريخ في الماضي.',
        INVALID_VALUE:          'القيمة غير صالحة.',
        INVALID_ROLE:           'هذا الدور غير صالح.',
        WEAK_PASSWORD:          'كلمة المرور ضعيفة: 8 أحرف على الأقل، حرف كبير، رقم، ورمز خاص، بدون فراغات.'
    },

    // ── French (LTR) ──────────────────────────────────────────────────────────
    fr: {
        // AUTH / USER
        UID_ALREADY_EXISTS:     "Cet identifiant est déjà utilisé.",
        EMAIL_ALREADY_EXISTS:   'Cette adresse e-mail est déjà utilisée.',
        INVALID_CREDENTIALS:    'Identifiant ou mot de passe incorrect.',
        ACCOUNT_DISABLED:       'Votre compte a été désactivé. Veuillez contacter le support.',
        USER_NOT_FOUND:         'Compte introuvable.',
        // REFRESH TOKEN
        REFRESH_TOKEN_MISSING:  'Votre session a expiré. Veuillez vous reconnecter.',
        REFRESH_TOKEN_INVALID:  'Session invalide. Veuillez vous reconnecter.',
        REFRESH_TOKEN_REVOKED:  'Votre session a été terminée. Veuillez vous reconnecter.',
        REFRESH_TOKEN_EXPIRED:  'Votre session a expiré. Veuillez vous reconnecter.',
        // INPUT
        VALIDATION_ERROR:       'Veuillez corriger les champs signalés.',
        INVALID_REQUEST_BODY:   "La requête n'a pas pu être lue. Veuillez réessayer.",
        // HTTP
        ACCESS_DENIED:          "Vous n'avez pas la permission d'effectuer cette action.",
        RESOURCE_NOT_FOUND:     'La ressource demandée est introuvable.',
        METHOD_NOT_ALLOWED:     "Cette action n'est pas autorisée.",
        RATE_LIMIT_EXCEEDED:    'Trop de requêtes, veuillez patienter avant de réessayer.',
        // FILES
        FILE_TOO_LARGE:           'Fichier trop volumineux (10 Mo max).',
        FILE_TYPE_NOT_ALLOWED:    'Type de fichier non autorisé.',
        FILE_EMPTY:               'Le fichier est vide.',
        FILE_NOT_FOUND:           'Fichier introuvable ou supprimé.',
        // GENERIC
        INTERNAL_ERROR:         "Une erreur inattendue s'est produite. Veuillez réessayer.",
        // FIELD-LEVEL
        REQUIRED:               'Ce champ est obligatoire.',
        INVALID_EMAIL:          'Veuillez saisir une adresse e-mail valide.',
        INVALID_SIZE:           'La valeur est trop courte ou trop longue.',
        INVALID_FORMAT:         'Le format est invalide.',
        OUT_OF_RANGE:           'La valeur est hors de la plage autorisée.',
        MUST_BE_POSITIVE:       'La valeur doit être positive.',
        MUST_BE_FUTURE:         'La date doit être dans le futur.',
        MUST_BE_PAST:           'La date doit être dans le passé.',
        INVALID_VALUE:          'La valeur est invalide.',
        INVALID_ROLE:           "Ce rôle est invalide.",
        WEAK_PASSWORD:          'Mot de passe trop faible : 8 caractères min., une majuscule, un chiffre, un caractère spécial, sans espace.'
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalises any locale code to one of the supported map keys.
 * Any unknown locale defaults to French.
 */
function resolveLang(lang: string): SupportedLang {
    return lang === 'ar' ? 'ar' : 'fr';
}

/**
 * Translates a top-level or field-level API error code into a human-readable
 * message in the requested language.
 *
 * Falls back to French for unsupported locales, and falls back to the raw
 * `code` string if the key is not in the map.
 *
 * @param code  - The error code returned by the backend (e.g. 'INVALID_EMAIL')
 * @param lang  - BCP-47 language tag or {@link SupportedLang}
 */
export function getErrorMessage(code: string, lang: string): string {
    const resolved = resolveLang(lang);
    return messages[resolved]?.[code as ApiErrorCode] ?? code;
}

/** Toast severity used when surfacing an API error code. */
export type ErrorSeverity = 'error' | 'warn' | 'info';

/**
 * Per-code toast severity. Conflict / out-of-date workflow codes are warnings
 * (the user just needs to retry on fresh data); "frozen" is informational;
 * everything else is an error. Unmapped codes default to 'error'.
 */
const SEVERITY: Partial<Record<ApiErrorCode, ErrorSeverity>> = {
    // Recoverable — user retries after a reload
    ACCESS_DENIED:          'warn',
    RESOURCE_NOT_FOUND:     'warn',
    RATE_LIMIT_EXCEEDED:    'warn',
    FILE_TOO_LARGE:         'warn',
    FILE_TYPE_NOT_ALLOWED:  'warn',
    FILE_EMPTY:             'warn',
    FILE_NOT_FOUND:         'warn'
};

export function getErrorSeverity(code: string): ErrorSeverity {
    return SEVERITY[code as ApiErrorCode] ?? 'error';
}

/**
 * Maps a `fieldErrors` record from the API response (field → error code) to
 * human-readable messages in the requested language.
 *
 * @example
 * const raw = { email: 'INVALID_EMAIL', fullName: 'REQUIRED' };
 * getFieldErrors(raw, 'fr');
 * // → { email: 'Veuillez saisir une adresse e-mail valide.', fullName: 'Ce champ est obligatoire.' }
 */
export function getFieldErrors(
    fieldErrors: Record<string, string>,
    lang: string
): Record<string, string> {
    const resolved = resolveLang(lang);
    const result: Record<string, string> = {};
    for (const [field, code] of Object.entries(fieldErrors)) {
        result[field] = messages[resolved]?.[code as FieldErrorCode] ?? code;
    }
    return result;
}
