import { Session } from "@supabase/supabase-js";
import { fromError } from "../error/error.util";

export function validateSession(session: Session | null): asserts session is NonNullable<Session> {
    if (!session?.access_token) {
        throw fromError({
            message: "No active session found",
            status: 401,
            error: "NO_SESSION",
        });
    }
}
