import {
    Block,
    BlockTree,
    BlockType,
    CreateBlockRequest,
    CreateBlockTypeRequest,
    GetBlockResponse,
    GetBlockTypesResponse,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api, isUUID } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

/**
 * Retrieve a block tree by id.
 */
export const getBlock = async (
    session: Session | null,
    params: { blockId: string; expandRefs?: boolean; maxDepth?: number }
): Promise<GetBlockResponse> => {
    const { blockId, expandRefs, maxDepth } = params;

    try {
        if (!isUUID(blockId)) {
            throw fromError({
                message: "Invalid block ID format. Expected a UUID.",
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
        const qs = new URLSearchParams();
        if (typeof expandRefs === "boolean") qs.set("expandRefs", String(expandRefs));
        if (typeof maxDepth === "number") qs.set("maxDepth", String(maxDepth));

        const query = qs.toString();

        const response = await fetch(`${url}/v1/block/${blockId}${query ? `?${query}` : ""}`, {
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
                message: `Failed to fetch block: ${response.status} ${response.statusText}`,
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
 * Create a new block.
 */
export const createBlock = async (
    session: Session | null,
    request: CreateBlockRequest
): Promise<Block> => {
    try {
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }

        const url = api();

        const response = await fetch(`${url}/v1/block/`, {
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
                message: `Failed to create block: ${response.status} ${response.statusText}`,
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
 * Update an existing block by id (PUT body is the full Block schema).
 */
export const updateBlock = async (
    session: Session | null,
    blockId: string,
    request: Block
): Promise<Block> => {
    try {
        if (!isUUID(blockId)) {
            throw fromError({
                message: "Invalid block ID format. Expected a UUID.",
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

        const response = await fetch(`${url}/v1/block/${blockId}`, {
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
                message: `Failed to update block: ${response.status} ${response.statusText}`,
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
 * Delete a block by id. The API expects the full block payload in the request body (see OpenAPI).
 */
export const deleteBlockById = async (
    session: Session | null,
    blockId: string,
    requestBody: Block
): Promise<Block> => {
    try {
        if (!isUUID(blockId)) {
            throw fromError({
                message: "Invalid block ID format. Expected a UUID.",
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

        const response = await fetch(`${url}/v1/block/${blockId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) return await response.json();

        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to delete block: ${response.status} ${response.statusText}`,
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
 * Update archive status for a block by id (PUT /v1/block/{blockId}/archive/{status})
 */
export const updateArchiveStatusByBlockId = async (
    session: Session | null,
    blockId: string,
    status: string,
    requestBody: Block
): Promise<Block> => {
    try {
        if (!isUUID(blockId)) {
            throw fromError({
                message: "Invalid block ID format. Expected a UUID.",
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

        const response = await fetch(`${url}/v1/block/${blockId}/archive/${encodeURIComponent(
            status
        )}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) return await response.json();

        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `Failed to update block archive status: ${response.status} ${response.statusText}`,
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
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }

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
