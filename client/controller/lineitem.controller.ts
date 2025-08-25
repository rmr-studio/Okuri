import {
    CreateLineItemRequest,
    CreateLineItemResponse,
    GetLineItemByIdPathParams,
    GetLineItemByIdResponse,
    GetLineItemsForOrganisationQueryParams,
    GetLineItemsForOrganisationResponse,
    UpdateLineItemPathParams,
    UpdateLineItemRequest,
    UpdateLineItemResponse,
} from "@/lib/interfaces/item.interface";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api, isUUID } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

export const fetchOrganisationLineItems = async (
    session: Session | null,
    organisation: Organisation
): Promise<GetLineItemsForOrganisationResponse> => {
    try {
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }
        const url = api();
        const queryParams: GetLineItemsForOrganisationQueryParams = {
            organisationId: organisation.id,
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const response = await fetch(`${url}/v1/item/?${queryString}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });
        if (response.ok) {
            return await response.json();
        }
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to fetch line items: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }
        throw fromError(errorData);
    } catch (error) {
        if (isResponseError(error)) throw error;
        throw fromError(error);
    }
};

export const createLineItem = async (
    session: Session | null,
    request: CreateLineItemRequest
): Promise<CreateLineItemResponse> => {
    try {
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }
        const url = api();
        const response = await fetch(`${url}/v1/item/`, {
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
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to create line item: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }
        throw fromError(errorData);
    } catch (error) {
        if (isResponseError(error)) throw error;
        throw fromError(error);
    }
};

export const updateLineItem = async (
    session: Session | null,
    request: UpdateLineItemRequest
): Promise<UpdateLineItemResponse> => {
    try {
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }
        const url = api();
        const pathParams: UpdateLineItemPathParams = {
            lineItemId: request.id,
        };
        const response = await fetch(
            `${url}/v1/item/${pathParams.lineItemId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(request),
            }
        );
        if (response.ok) {
            return await response.json();
        }
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to update line item: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }
        throw fromError(errorData);
    } catch (error) {
        if (isResponseError(error)) throw error;
        throw fromError(error);
    }
};

export const getLineItemById = async (
    session: Session | null,
    params: GetLineItemByIdPathParams
): Promise<GetLineItemByIdResponse> => {
    const { lineItemId } = params;
    try {
        if (!isUUID(lineItemId)) {
            throw fromError({
                message: "Invalid line item ID format. Expected a UUID.",
                status: 400,
                error: "INVALID_ID",
            });
        }
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }
        const url = api();
        const response = await fetch(`${url}/v1/item/${lineItemId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });
        if (response.ok) {
            return await response.json();
        }
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to fetch line item: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }
        throw fromError(errorData);
    } catch (error) {
        throw fromError(error);
    }
};
