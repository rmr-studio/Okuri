import {
    Block,
    CreateBlockRequest,
    GetBlockResponse,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { handleError, validateSession, validateUuid } from "@/lib/util/controller/controller.util";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api } from "@/lib/util/utils";
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
        validateUuid(blockId);
        validateSession(session);

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
        throw await handleError(
            response,
            (res) => `Failed to fetch block: ${res.status} ${res.statusText}`
        );
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
        validateSession(session);
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

        throw await handleError(
            response,
            (res) => `Failed to create block: ${res.status} ${res.statusText}`
        );
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
        validateUuid(blockId);
        validateSession(session);

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
        throw await handleError(
            response,
            (res) => `Failed to update block: ${res.status} ${res.statusText}`
        );
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
        validateUuid(blockId);
        validateSession(session);

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

        throw await handleError(
            response,
            (res) => `Failed to delete block: ${res.status} ${res.statusText}`
        );
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
        validateUuid(blockId);
        validateSession(session);
        const url = api();

        const response = await fetch(
            `${url}/v1/block/${blockId}/archive/${encodeURIComponent(status)}`,
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

        throw await handleError(
            response,
            (res) => `Failed to update block archive status: ${res.status} ${res.statusText}`
        );
    } catch (error) {
        if (isResponseError(error)) throw error;
        throw fromError(error);
    }
};
