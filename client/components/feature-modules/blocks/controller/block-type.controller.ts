import {
    BlockType,
    CreateBlockTypeRequest,
    GetBlockTypesResponse,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { validateSession } from "@/lib/util/controller/controller.util";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api, isUUID } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

/**
 * Publish (create) a block type
 */
export const publishBlockType = async (
    session: Session | null,
    request: CreateBlockTypeRequest
): Promise<BlockType> => {
    try {
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }

        const url = api();

        const response = await fetch(`${url}/v1/block/schema/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
        });

        if (response.ok) return await response.json();

        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to publish block type: ${response.status} ${response.statusText}`,
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

/**
 * Update an existing block type by id
 */
export const updateBlockType = async (
    session: Session | null,
    blockTypeId: string,
    request: BlockType
): Promise<BlockType> => {
    try {
        if (!isUUID(blockTypeId)) {
            throw fromError({
                message: "Invalid block type ID format. Expected a UUID.",
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

        const response = await fetch(`${url}/v1/block/schema/${blockTypeId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
        });

        if (response.ok) return await response.json();

        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to update block type: ${response.status} ${response.statusText}`,
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

/**
 * Update archive status on a block type
 */
export const updateArchiveStatusByBlockTypeId = async (
    session: Session | null,
    blockTypeId: string,
    status: string,
    requestBody: BlockType
): Promise<BlockType> => {
    try {
        if (!isUUID(blockTypeId)) {
            throw fromError({
                message: "Invalid block type ID format. Expected a UUID.",
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

        const response = await fetch(
            `${url}/v1/block/schema/${blockTypeId}/archive/${encodeURIComponent(status)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (response.ok) return await response.json();

        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to update block type archive status: ${response.status} ${response.statusText}`,
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

/**
 * Get block types for an organisation
 */
export const getBlockTypes = async (
    session: Session | null,
    organisationId: string
): Promise<GetBlockTypesResponse> => {
    try {
        if (!isUUID(organisationId)) {
            throw fromError({
                message: "Invalid organisation ID format. Expected a UUID.",
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

        const response = await fetch(`${url}/v1/block/schema/organisation/${organisationId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (response.ok) return await response.json();

        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to fetch block types: ${response.status} ${response.statusText}`,
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

/**
 * Get a block type by key
 */
export const getBlockTypeByKey = async (
    session: Session | null,
    key: string
): Promise<BlockType> => {
    try {
        validateSession(session);

        const url = api();

        const response = await fetch(`${url}/v1/block/schema/key/${encodeURIComponent(key)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (response.ok) return await response.json();

        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to fetch block type by key: ${response.status} ${response.statusText}`,
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

export const lintBlockType = async (session: Session | null, blockType: BlockType) => {
    try {
        validateSession(session);
    } catch (error) {}
};
