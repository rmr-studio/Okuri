import {
    CreateClientRequest,
    CreateClientResponse,
    GetClientByIdPathParams,
    GetClientByIdResponse,
    GetOrganisationClientsResponse,
    UpdateClientRequest,
    UpdateClientResponse,
} from "@/components/feature-modules/client/interface/client.interface";
import { Organisation } from "@/components/feature-modules/organisation/interface/organisation.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

export const fetchOrganisationClients = async (
    session: Session | null,
    organisation: Organisation
): Promise<GetOrganisationClientsResponse> => {
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

        const response = await fetch(`${url}/v1/client/organisation/${organisation.id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (response.ok) {
            return await response.json();
        }

        throw await handleError(
            response,
            (res) => `Failed to fetch clients: ${res.status} ${res.statusText}`
        );
    } catch (error) {
        if (isResponseError(error)) throw error;

        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};

export const updateClient = async (
    session: Session | null,
    request: UpdateClientRequest
): Promise<UpdateClientResponse> => {
    try {
        // Validate session and access token
        validateSession(session);

        const url = api();

        const response = await fetch(`${url}/v1/client/${request.id}`, {
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
        throw await handleError(
            response,
            (res) => `Failed to update client: ${res.status} ${res.statusText}`
        );
    } catch (error) {
        if (isResponseError(error)) throw error;

        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};

export const getClient = async (
    session: Session | null,
    params: GetClientByIdPathParams
): Promise<GetClientByIdResponse> => {
    const { clientId } = params;
    try {
        validateUuid(clientId);
        // Validate session and access token
        validateSession(session);

        const url = api();
        const response = await fetch(`${url}/v1/client/${clientId}`, {
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
        throw await handleError(
            response,
            (res) => `Failed to fetch client: ${res.status} ${res.statusText}`
        );
    } catch (error) {
        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};

export const createClient = async (
    session: Session | null,
    request: CreateClientRequest
): Promise<CreateClientResponse> => {
    try {
        // Validate session and access token
        validateSession(session);
        const url = api();

        const response = await fetch(`${url}/v1/client/`, {
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
        throw await handleError(
            response,
            (res) => `Failed to create client: ${res.status} ${res.statusText}`
        );
    } catch (error) {
        if (isResponseError(error)) throw error;

        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};
