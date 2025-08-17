import {
    CreateOrganisationRequest,
    CreateOrganisationResponse,
    GetOrganisationPathParams,
    GetOrganisationResponse,
} from "@/lib/interfaces/organisation.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api, isUUID } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

export const createOrganisation = async (
    session: Session | null,
    request: CreateOrganisationRequest
): Promise<CreateOrganisationResponse> => {
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

        const response = await fetch(`${url}/v1/organisation/`, {
            method: "POST",
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
                message: `Failed to create organisation: ${response.status} ${response.statusText}`,
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

export const getOrganisation = async (
    session: Session | null,
    params: GetOrganisationPathParams
): Promise<GetOrganisationResponse> => {
    const { organisationId } = params;
    try {
        // Validate id is a UUID
        if (!isUUID(organisationId)) {
            throw fromError({
                message: "Invalid organization ID format. Expected a UUID.",
                status: 400,
                error: "INVALID_ID",
            });
        }

        // Validate session and access token
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }

        const url = api();
        const response = await fetch(
            `${url}/v1/organisation/${organisationId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            }
        );

        if (response.ok) {
            return await response.json();
        }

        // Parse server error response
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to fetch organisation: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }

        throw fromError(errorData);
    } catch (error) {
        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};
