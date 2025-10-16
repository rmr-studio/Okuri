import {
    GetCurrentUserResponse,
    UpdateUserProfileRequest,
    UpdateUserProfileResponse,
} from "@/components/feature-modules/user/interface/user.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

/**
 * Will fetch the Current authenticated user's detailed profile from the
 * active session token
 * @param {Session} session - The current active session for the user
 * @returns {GetCurrentUserResponse} - The user's profile
 */
export const fetchSessionUser = async (
    session: Session | null
): Promise<GetCurrentUserResponse> => {
    try {
        // Validate session and access token
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
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

        // Parse server error response
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to fetch user: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }
        throw fromError(errorData);
    } catch (error) {
        if (isResponseError(error)) throw error;

        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};

export const updateUser = async (
    session: Session | null,
    request: UpdateUserProfileRequest,
    updatedAvatar?: Blob | null
): Promise<UpdateUserProfileResponse> => {
    try {
        // Validate session and access token
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }

        const url = api();

        const response = await fetch(`${url}/v1/user/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
        });

        if (response.ok) {
            return await response.json();
        }
        // Parse server error response
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to create update user: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }
        throw fromError(errorData);
    } catch (error) {
        if (isResponseError(error)) throw error;

        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};
