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
        // ORG UNITS
        ORG_UNIT_CYCLE:         'لا يمكن نقل وحدة تحت إحدى وحداتها الفرعية.',
        ORG_UNIT_HAS_CHILDREN:  'احذف أو انقل الوحدات الفرعية أولاً.',
        ORG_UNIT_HAS_USERS:     'أعد تعيين أعضاء هذه الوحدة أولاً.',
        ORG_UNIT_NOT_FOUND:     'الوحدة التنظيمية غير موجودة.',
        // NOMENCLATURE DEFINITIONS
        NOMENCLATURE_DEFINITION_NAME_EXISTS:      'اسم التعريف موجود بالفعل.',
        NOMENCLATURE_DEFINITION_NO_LEVELS:        'أضف مستوى واحدًا على الأقل.',
        NOMENCLATURE_DEFINITION_LEVEL_DUPLICATE:  'لا يمكن أن يحمل مستويان نفس الاسم.',
        NOMENCLATURE_DEFINITION_NOT_FOUND:        'تعريف التصنيف غير موجود.',
        NOMENCLATURE_DEFINITION_IN_USE:           'هذا التعريف مستعمل من طرف تصنيف — لا يمكن الحذف.',
        // NOMENCLATURES + RUBRIQUES
        NOMENCLATURE_NAME_EXISTS:   'اسم التصنيف موجود بالفعل.',
        NOMENCLATURE_NOT_FOUND:     'التصنيف غير موجود.',
        NOMENCLATURE_EMPTY:         'أضف بندًا واحدًا على الأقل قبل التثبيت.',
        NOMENCLATURE_NOT_DRAFT:     'التصنيف مثبَّت: لا يمكن التعديل.',
        NOMENCLATURE_ARCHIVED:      'التصنيف مؤرشف: للقراءة فقط.',
        RUBRIQUE_CODE_EXISTS:       'هذا الرمز موجود بالفعل في هذا التصنيف.',
        RUBRIQUE_PARENT_IS_LEAF:    'لا يمكن الإضافة تحت سطر ميزانية (ورقة).',
        RUBRIQUE_HAS_CHILDREN:      'احذف البنود الفرعية أولاً.',
        RUBRIQUE_HAS_ASSIGNMENTS:   'هذا البند مُسند إلى وحدة — أزل الإسناد أولاً.',
        RUBRIQUE_NOT_FOUND:         'البند غير موجود.',
        NOMENCLATURE_NOT_FIXED:        'يجب تثبيت التصنيف قبل إسناد البنود.',
        RUBRIQUE_ASSIGNMENT_EXISTS:    'هذا البند مُسند بالفعل لهذه الوحدة.',
        RUBRIQUE_ASSIGNMENT_NOT_FOUND: 'الإسناد غير موجود.',
        RUBRIQUE_WRONG_NOMENCLATURE:   'هذا البند لا ينتمي إلى هذا التصنيف.',
        // PROJECTS
        PROJECT_NOT_FOUND:        'المشروع غير موجود.',
        PROJECT_INVALID_STATUS:   'الإجراء غير ممكن في الحالة الحالية للمشروع.',
        // SETTINGS
        SETTING_NOT_FOUND:        'الإعداد غير موجود.',
        SETTING_INVALID_VALUE:    'القيمة غير صالحة لهذا الإعداد.',
        // FILES
        FILE_TOO_LARGE:           'الملف كبير جداً (10 ميغابايت كحد أقصى).',
        FILE_TYPE_NOT_ALLOWED:    'نوع الملف غير مسموح به.',
        FILE_EMPTY:               'الملف فارغ.',
        FILE_NOT_FOUND:           'الملف غير موجود أو تمت إزالته.',
        // GENERIC
        DATA_INTEGRITY_VIOLATION: 'العملية غير ممكنة: هذا العنصر ما زال مستعملاً.',
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
        // ORG UNITS
        ORG_UNIT_CYCLE:         "Impossible de déplacer une unité sous l'une de ses sous-unités.",
        ORG_UNIT_HAS_CHILDREN:  "Supprimez ou déplacez d'abord les sous-unités.",
        ORG_UNIT_HAS_USERS:     "Réaffectez d'abord les membres de cette unité.",
        ORG_UNIT_NOT_FOUND:     "Unité d'organisation introuvable.",
        // NOMENCLATURE DEFINITIONS
        NOMENCLATURE_DEFINITION_NAME_EXISTS:      "Ce nom de définition existe déjà.",
        NOMENCLATURE_DEFINITION_NO_LEVELS:        "Ajoutez au moins un niveau.",
        NOMENCLATURE_DEFINITION_LEVEL_DUPLICATE:  "Deux niveaux ne peuvent pas porter le même nom.",
        NOMENCLATURE_DEFINITION_NOT_FOUND:        "Définition de nomenclature introuvable.",
        NOMENCLATURE_DEFINITION_IN_USE:           "Cette définition est utilisée par une nomenclature — suppression impossible.",
        // NOMENCLATURES + RUBRIQUES
        NOMENCLATURE_NAME_EXISTS:   "Ce nom de nomenclature existe déjà.",
        NOMENCLATURE_NOT_FOUND:     "Nomenclature introuvable.",
        NOMENCLATURE_EMPTY:         "Ajoutez au moins une rubrique avant de figer.",
        NOMENCLATURE_NOT_DRAFT:     "La nomenclature est figée : modification impossible.",
        NOMENCLATURE_ARCHIVED:      "La nomenclature est archivée : lecture seule.",
        RUBRIQUE_CODE_EXISTS:       "Ce code existe déjà dans cette nomenclature.",
        RUBRIQUE_PARENT_IS_LEAF:    "Impossible d'ajouter sous une ligne budgétaire (feuille).",
        RUBRIQUE_HAS_CHILDREN:      "Supprimez d'abord les sous-rubriques.",
        RUBRIQUE_HAS_ASSIGNMENTS:   "Cette rubrique est affectée à une unité — retirez l'affectation d'abord.",
        RUBRIQUE_NOT_FOUND:         "Rubrique introuvable.",
        NOMENCLATURE_NOT_FIXED:        "La nomenclature doit être figée pour affecter des rubriques.",
        RUBRIQUE_ASSIGNMENT_EXISTS:    "Cette rubrique est déjà affectée à cette unité.",
        RUBRIQUE_ASSIGNMENT_NOT_FOUND: "Affectation introuvable.",
        RUBRIQUE_WRONG_NOMENCLATURE:   "Cette rubrique n'appartient pas à cette nomenclature.",
        // PROJECTS
        PROJECT_NOT_FOUND:        "Projet introuvable.",
        PROJECT_INVALID_STATUS:   "Action impossible dans l'état actuel du projet.",
        // SETTINGS
        SETTING_NOT_FOUND:        "Paramètre introuvable.",
        SETTING_INVALID_VALUE:    "Valeur invalide pour ce paramètre.",
        // FILES
        FILE_TOO_LARGE:           'Fichier trop volumineux (10 Mo max).',
        FILE_TYPE_NOT_ALLOWED:    'Type de fichier non autorisé.',
        FILE_EMPTY:               'Le fichier est vide.',
        FILE_NOT_FOUND:           'Fichier introuvable ou supprimé.',
        // GENERIC
        DATA_INTEGRITY_VIOLATION: "Opération impossible : cet élément est encore utilisé.",
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
    // Org-unit guards — explain what to do first
    ORG_UNIT_CYCLE:         'warn',
    ORG_UNIT_HAS_CHILDREN:  'warn',
    ORG_UNIT_HAS_USERS:     'warn',
    // Tree-type validation — fix the input
    NOMENCLATURE_DEFINITION_NAME_EXISTS:     'warn',
    NOMENCLATURE_DEFINITION_NO_LEVELS:       'warn',
    NOMENCLATURE_DEFINITION_LEVEL_DUPLICATE: 'warn',
    NOMENCLATURE_DEFINITION_IN_USE:          'warn',
    // Nomenclature / rubrique guards — fix the input first
    NOMENCLATURE_NAME_EXISTS:   'warn',
    NOMENCLATURE_EMPTY:         'warn',
    NOMENCLATURE_NOT_DRAFT:     'warn',
    NOMENCLATURE_ARCHIVED:      'warn',
    RUBRIQUE_CODE_EXISTS:       'warn',
    RUBRIQUE_PARENT_IS_LEAF:    'warn',
    RUBRIQUE_HAS_CHILDREN:      'warn',
    RUBRIQUE_HAS_ASSIGNMENTS:   'warn',
    NOMENCLATURE_NOT_FIXED:     'warn',
    RUBRIQUE_ASSIGNMENT_EXISTS: 'warn',
    // Project state guard — explain the current status blocks the action
    PROJECT_INVALID_STATUS:     'warn',
    SETTING_INVALID_VALUE:      'warn',
    FILE_TOO_LARGE:         'warn',
    FILE_TYPE_NOT_ALLOWED:  'warn',
    FILE_EMPTY:             'warn',
    FILE_NOT_FOUND:         'warn',
    DATA_INTEGRITY_VIOLATION: 'warn'
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
