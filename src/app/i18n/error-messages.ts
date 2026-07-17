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
        // AUTH
        EMAIL_ALREADY_EXISTS:   'هذا البريد الإلكتروني مسجل مسبقاً.',
        INVALID_CREDENTIALS:    'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
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
        // ADMIN
        CHANGES_FROZEN:         'انتهت فترة التحقيق العام — طلباتكم قيد المعالجة.',
        CHANGE_FREEZE_REQUIRED: 'يجب تفعيل تجميد التعديلات قبل بدء المعالجة.',
        // PA REQUEST / WORKFLOW
        TASK_NOT_RESERVED:        'هذه المهمة محجوزة لمستخدم آخر.',
        INVALID_WORKFLOW_STATE:   'تغيّرت حالة الملف، يرجى إعادة التحميل.',
        INVALID_REVIEW_STATUS:    'حالة المعالجة غير صالحة.',
        PA_REQUEST_NOT_FOUND:     'الطلب غير موجود.',
        PA_SUB_REQUEST_NOT_FOUND: 'الطلب الفرعي غير موجود.',
        NOT_REQUEST_OWNER:        'لستَ صاحب هذا الطلب.',
        REQUEST_NOT_EDITABLE:     'لم يعد هذا الطلب قابلاً للتعديل.',
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
        INVALID_ROLE:           'هذا الدور غير مسموح به.',
        WEAK_PASSWORD:          'كلمة المرور ضعيفة: يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، رقم، ورمز خاص.'
    },

    // ── French (LTR) ──────────────────────────────────────────────────────────
    fr: {
        // AUTH
        EMAIL_ALREADY_EXISTS:   'Cette adresse e-mail est déjà utilisée.',
        INVALID_CREDENTIALS:    'E-mail ou mot de passe incorrect.',
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
        // ADMIN
        CHANGES_FROZEN:         "L'enquête publique est terminée — vos requêtes sont en cours de traitement.",
        CHANGE_FREEZE_REQUIRED: "Le gel des modifications doit être actif avant de démarrer l'instruction.",
        // PA REQUEST / WORKFLOW
        TASK_NOT_RESERVED:        'Cette tâche est réservée à un autre utilisateur.',
        INVALID_WORKFLOW_STATE:   "L'état du dossier a changé, veuillez recharger.",
        INVALID_REVIEW_STATUS:    "Statut d'instruction invalide.",
        PA_REQUEST_NOT_FOUND:     'Demande introuvable.',
        PA_SUB_REQUEST_NOT_FOUND: 'Sous-demande introuvable.',
        NOT_REQUEST_OWNER:        "Vous n'êtes pas le propriétaire de cette demande.",
        REQUEST_NOT_EDITABLE:     "Cette demande n'est plus modifiable.",
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
        INVALID_ROLE:           "Ce rôle n'est pas assignable.",
        WEAK_PASSWORD:          'Mot de passe trop faible : 8 caractères min., une majuscule, un chiffre et un caractère spécial requis.'
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
    // Workflow / stale-state — user retries after a reload
    TASK_NOT_RESERVED:      'warn',
    INVALID_WORKFLOW_STATE: 'warn',
    INVALID_REVIEW_STATUS:  'warn',
    ACCESS_DENIED:          'warn',
    RESOURCE_NOT_FOUND:     'warn',
    REQUEST_NOT_EDITABLE:   'warn',
    RATE_LIMIT_EXCEEDED:    'warn',
    FILE_TOO_LARGE:         'warn',
    FILE_TYPE_NOT_ALLOWED:  'warn',
    FILE_EMPTY:             'warn',
    FILE_NOT_FOUND:         'warn',
    // Informational
    CHANGES_FROZEN:         'info',
    // Precondition (admin action blocked until freeze is on)
    CHANGE_FREEZE_REQUIRED: 'warn'
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
