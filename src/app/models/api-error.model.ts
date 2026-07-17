import { HttpErrorResponse } from '@angular/common/http';

// ─── Top-level error codes ────────────────────────────────────────────────────

export type ApiErrorCode =
    // AUTH
    | 'EMAIL_ALREADY_EXISTS'
    | 'INVALID_CREDENTIALS'
    | 'ACCOUNT_DISABLED'
    | 'USER_NOT_FOUND'
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
    // ADMIN
    | 'CHANGES_FROZEN'
    | 'CHANGE_FREEZE_REQUIRED'
    // PA REQUEST / WORKFLOW
    | 'TASK_NOT_RESERVED'
    | 'INVALID_WORKFLOW_STATE'
    | 'INVALID_REVIEW_STATUS'
    | 'PA_REQUEST_NOT_FOUND'
    | 'PA_SUB_REQUEST_NOT_FOUND'
    | 'NOT_REQUEST_OWNER'
    | 'REQUEST_NOT_EDITABLE'
    // FILES
    | 'FILE_TOO_LARGE'
    | 'FILE_TYPE_NOT_ALLOWED'
    | 'FILE_EMPTY'
    | 'FILE_NOT_FOUND'
    // GENERIC
    | 'INTERNAL_ERROR';

/**
 * Codes that mean "your view is out of date because the workflow moved on".
 * After showing the toast, the caller must re-fetch the request/list so the
 * active-task fields and action buttons reflect reality.
 */
export const STALE_STATE_CODES = new Set<string>([
    'TASK_NOT_RESERVED',
    'INVALID_WORKFLOW_STATE',
    'ACCESS_DENIED',
    'RESOURCE_NOT_FOUND',
    'REQUEST_NOT_EDITABLE'
]);

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
