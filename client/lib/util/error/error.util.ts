export interface ResponseError extends Error {
    status: number;
    error: string;
    message: string;
    stackTrace?: string;
    details?: unknown;
}

/**
 * Converts an unknown error into a ResponseError with proper formatting
 */
export function fromError(error: unknown): ResponseError {
    const defaultStatus = 500;
    const defaultError = "UNKNOWN_ERROR";
    const defaultMessage = "An unexpected error occurred";

    // Already a ResponseError
    if (isResponseError(error)) {
        return error;
    }

    // Standard Error
    if (error instanceof Error) {
        return Object.assign(new Error(error.message || defaultMessage), {
            name: "ResponseError",
            status: defaultStatus,
            error: defaultError,
            message: error.message || defaultMessage,
            stackTrace: error.stack,
        });
    }

    // Custom object with message
    if (typeof error === "object" && error !== null && "message" in error) {
        const e = error as {
            message?: unknown;
            status?: unknown;
            error?: unknown;
            stackTrace?: unknown;
            [key: string]: unknown;
        };

        const message = String(e.message || defaultMessage);
        const status = Number(e.status) || defaultStatus;
        const errorCode = String(e.error || defaultError);

        return Object.assign(new Error(message), {
            name: "ResponseError",
            status,
            error: errorCode,
            message,
            stackTrace: e.stackTrace ? String(e.stackTrace) : undefined,
            details: error,
        });
    }

    // Object without message - serialize it
    if (typeof error === "object" && error !== null) {
        try {
            const serialized = JSON.stringify(error, null, 2);
            return Object.assign(new Error(serialized), {
                name: "ResponseError",
                status: defaultStatus,
                error: defaultError,
                message: `Error object: ${serialized}`,
                stackTrace: undefined,
                details: error,
            });
        } catch {
            // Fallback if JSON.stringify fails
            return Object.assign(new Error(defaultMessage), {
                name: "ResponseError",
                status: defaultStatus,
                error: defaultError,
                message: `${defaultMessage} (unable to serialize error)`,
                stackTrace: undefined,
                details: error,
            });
        }
    }

    // Primitive error
    return Object.assign(new Error(String(error) || defaultMessage), {
        name: "ResponseError",
        status: defaultStatus,
        error: defaultError,
        message: String(error) || defaultMessage,
        stackTrace: undefined,
    });
}

/**
 * Gets a human-readable string representation of the error
 */
export function formatError(error: ResponseError): string {
    const parts = [`[${error.status}] ${error.error}: ${error.message}`];

    if (error.details) {
        try {
            parts.push(`Details: ${JSON.stringify(error.details, null, 2)}`);
        } catch {
            // Ignore serialization errors
        }
    }

    if (error.stackTrace) {
        parts.push(`Stack: ${error.stackTrace}`);
    }

    return parts.join("\n");
}

export function isResponseError(error: unknown): error is ResponseError {
    return (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "error" in error &&
        "message" in error
    );
}
