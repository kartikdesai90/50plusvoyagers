import axios from 'axios';

/**
 * A transport-agnostic view of a failed request, so components never have to
 * poke at axios internals to render an error.
 */
export type NormalizedError = {
    /** Safe to show a user. */
    message: string;
    status: number | null;
    /** First validation message per field, keyed by field name. */
    fieldErrors: Record<string, string>;
};

const GENERIC = 'Something went wrong. Please try again.';

type LaravelErrorBody = {
    message?: unknown;
    errors?: Record<string, unknown>;
};

function toFieldErrors(errors: Record<string, unknown> | undefined): Record<string, string> {
    if (!errors) return {};

    const result: Record<string, string> = {};

    for (const [field, messages] of Object.entries(errors)) {
        const first: unknown = Array.isArray(messages) ? (messages as unknown[])[0] : messages;
        if (typeof first === 'string') result[field] = first;
    }

    return result;
}

/**
 * Maps an unknown thrown value onto something renderable. Status-specific
 * copy is deliberate: "please refresh" is actionable, "Request failed with
 * status code 419" is not.
 */
export function normalizeError(error: unknown): NormalizedError {
    if (!axios.isAxiosError(error)) {
        return { message: GENERIC, status: null, fieldErrors: {} };
    }

    if (!error.response) {
        return {
            message: 'Cannot reach the server. Check your connection and try again.',
            status: null,
            fieldErrors: {},
        };
    }

    const status = error.response.status;
    const body = (error.response.data ?? {}) as LaravelErrorBody;
    const serverMessage = typeof body.message === 'string' ? body.message : null;
    const fieldErrors = toFieldErrors(body.errors);

    switch (status) {
        case 419:
            return {
                message: 'Your session expired. Please refresh the page and try again.',
                status,
                fieldErrors,
            };
        case 422:
            return {
                message: serverMessage ?? 'Please correct the highlighted fields.',
                status,
                fieldErrors,
            };
        case 429:
            return {
                message: serverMessage ?? 'Too many attempts. Please wait and try again.',
                status,
                fieldErrors,
            };
        case 401:
            return { message: serverMessage ?? 'Your session has ended.', status, fieldErrors };
        case 403:
            return {
                message: serverMessage ?? 'You do not have access to this area.',
                status,
                fieldErrors,
            };
        default:
            return {
                message: status >= 500 ? GENERIC : (serverMessage ?? GENERIC),
                status,
                fieldErrors,
            };
    }
}
