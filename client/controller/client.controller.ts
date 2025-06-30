import { Client, ClientCreationRequest } from "@/lib/interfaces/client.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api, isUUID } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

export const fetchUserClients = async (session: Session | null): Promise<Client[]> => {
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

        const response = await fetch(`${url}/v1/client/`, {
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
                message: `Failed to fetch clients: ${response.status} ${response.statusText}`,
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

export const updateClient = async (session: Session | null, client: Client): Promise<Client> => {
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

        const response = await fetch(`${url}/v1/client/${client.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(client),
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
                message: `Failed to update client: ${response.status} ${response.statusText}`,
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

export const getClient = async (session: Session | null, id: string): Promise<Client> => {
    try {
        // Validate id is a UUID
        if (!isUUID(id)) {
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
        const response = await fetch(`${url}/v1/client/${id}`, {
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
                message: `Failed to fetch client: ${response.status} ${response.statusText}`,
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

export const createClient = async (
    session: Session | null,
    client: ClientCreationRequest
): Promise<Client> => {
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

        const response = await fetch(`${url}/v1/client/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(client),
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
                message: `Failed to create client: ${response.status} ${response.statusText}`,
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
