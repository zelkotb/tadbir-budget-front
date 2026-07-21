import { HttpErrorResponse } from '@angular/common/http';

// ─── Top-level error codes ────────────────────────────────────────────────────

export type ApiErrorCode =
    // AUTH / USER
    | 'INVALID_CREDENTIALS'
    | 'ACCOUNT_DISABLED'
    | 'USER_NOT_FOUND'
    | 'UID_ALREADY_EXISTS'
    | 'EMAIL_ALREADY_EXISTS'
    | 'INVALID_ROLE'
    | 'WEAK_PASSWORD'
    // REFRESH TOKEN
    | 'REFRESH_TOKEN_MISSING'
    | 'REFRESH_TOKEN_INVALID'
    | 'REFRESH_TOKEN_REVOKED'
    | 'REFRESH_TOKEN_EXPIRED'
    // INPUT
    | 'VALIDATION_ERROR'
    | 'INVALID_REQUEST_BODY'
    // HTTP
    | 'ACCESS_DENIED'
    | 'RESOURCE_NOT_FOUND'
    | 'METHOD_NOT_ALLOWED'
    | 'RATE_LIMIT_EXCEEDED'
    // ORG UNITS
    | 'ORG_UNIT_CYCLE'
    | 'ORG_UNIT_HAS_CHILDREN'
    | 'ORG_UNIT_HAS_USERS'
    | 'ORG_UNIT_NOT_FOUND'
    // BUDGET TREE TYPES
    | 'NOMENCLATURE_DEFINITION_NAME_EXISTS'
    | 'NOMENCLATURE_DEFINITION_NO_LEVELS'
    | 'NOMENCLATURE_DEFINITION_LEVEL_DUPLICATE'
    | 'NOMENCLATURE_DEFINITION_NOT_FOUND'
    // FILES
    | 'FILE_TOO_LARGE'
    | 'FILE_TYPE_NOT_ALLOWED'
    | 'FILE_EMPTY'
    | 'FILE_NOT_FOUND'
    // GENERIC
    | 'INTERNAL_ERROR';

// ─── Field-level error codes ──────────────────────────────────────────────────

export type FieldErrorCode =
    | 'REQUIRED'
    | 'INVALID_EMAIL'
    | 'INVALID_SIZE'
    | 'INVALID_FORMAT'
    | 'OUT_OF_RANGE'
    | 'MUST_BE_POSITIVE'
    | 'MUST_BE_FUTURE'
    | 'MUST_BE_PAST'
    | 'INVALID_VALUE'
    | 'INVALID_ROLE'
    | 'WEAK_PASSWORD';

// ─── API error shape ──────────────────────────────────────────────────────────

/**
 * Shape of every non-2xx response body from the backend.
 * The error interceptor attaches the parsed value to the re-thrown error
 * so individual components can read `err.apiError` directly.
 */
export interface ApiError {
    /** Machine-readable error code */
    code: ApiErrorCode;
    /** Mirrors the HTTP status */
    status: number;
    /** ISO-8601 timestamp from the server */
    timestamp: string;
    /** Present only when code === 'VALIDATION_ERROR' */
    fieldErrors?: Record<string, FieldErrorCode>;
}

/**
 * The shape re-thrown by the error interceptor.
 * Extends the raw HttpErrorResponse with a typed `apiError` property.
 */
export interface ApiHttpError extends HttpErrorResponse {
    apiError: ApiError;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Safely extracts an {@link ApiError} from the body of an HttpErrorResponse.
 * Returns `null` if the response body does not match the expected shape.
 */
export function parseApiError(err: HttpErrorResponse): ApiError | null {
    try {
        const body = err.error;
        if (body && typeof body === 'object' && typeof body['code'] === 'string') {
            return body as ApiError;
        }
        return null;
    } catch {
        return null;
    }
}

/** Codes that mean the *refresh token* itself is bad — trigger a silent refresh. */
export const REFRESH_TOKEN_CODES = new Set<string>([
    'REFRESH_TOKEN_MISSING',
    'REFRESH_TOKEN_INVALID',
    'REFRESH_TOKEN_REVOKED',
    'REFRESH_TOKEN_EXPIRED'
]);
