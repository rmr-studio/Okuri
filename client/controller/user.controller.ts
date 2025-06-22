import { User } from "@/lib/interfaces/user.interface";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

/**
 * Will fetch the Current authenticated user's detailed profile from the
 * active session token
 * @param {Session} session - The current active session for the user
 * @returns {UserDTO} - The user's profile
 */
export const fetchSessionUser = async (
    session: Session | null
): Promise<User> => {
    if (!session?.access_token) {
        throw new Error("No active session found");
    }

    const url = api();

    const response = await fetch(`${url}/v1/user/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
        },
    });

    if (response.ok) {
        return await response.json();
    }

    throw new Error(
        `Failed to fetch user profile: ${response.status} ${response.statusText}`
    );
};

export const updateUser = async (
    session: Session | null,
    user: User
): Promise<User> => {
    if (!session?.access_token) {
        throw new Error("No active session found");
    }

    const url = api();

    const response = await fetch(`${url}/v1/user/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(user),
    });

    if (response.ok) {
        return await response.json();
    }

    throw new Error(
        `Failed to update user profile: ${response.status} ${response.statusText}`
    );
};
