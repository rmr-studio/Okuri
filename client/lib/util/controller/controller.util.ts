import { Session } from "@supabase/supabase-js";
import {} from "uuid";
import { fromError, ResponseError } from "../error/error.util";
import { isUUID } from "../utils";

export function validateSession(session: Session | null): asserts session is NonNullable<Session> {
    if (!session?.access_token) {
        throw fromError({
            message: "No active session found",
            status: 401,
            error: "NO_SESSION",
        });
    }
}

export function validateUuid(id: string) {
    if (!isUUID(id)) {
        throw fromError({
            message: "Invalid ID format. Expected a UUID.",
            status: 400,
            error: "INVALID_ID",
        });
    }
}

export async function handleError(
    response: Response,
    message: (response: Response) => string
): Promise<ResponseError> {
    // Parse server error response
    let errorData;
    try {
        errorData = await response.json();
    } catch {
        errorData = {
            message: message(response),
            status: response.status,
            error: "SERVER_ERROR",
        };
    }
    return fromError(errorData);
}
