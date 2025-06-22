export interface ResponseError extends Error {
    status: number;
    error: string;
    message: string;
    stackTrace?: string;
}

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

    // Custom object
    if (typeof error === "object" && error !== null && "message" in error) {
        const e = error as {
            message?: unknown;
            status?: unknown;
            error?: unknown;
            stackTrace?: unknown;
        };

        return Object.assign(new Error(String(e.message || defaultMessage)), {
            name: "ResponseError",
            status: Number(e.status) || defaultStatus,
            error: String(e.error || defaultError),
            message: String(e.message || defaultMessage),
            stackTrace: e.stackTrace ? String(e.stackTrace) : undefined,
        });
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

export function isResponseError(error: unknown): error is ResponseError {
    return (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "error" in error &&
        "message" in error
    );
}
