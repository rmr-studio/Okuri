import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";
import { Reference } from "../interface/block.interface";

/**
 * Request to hydrate (resolve entity references for) one or more blocks.
 *
 * TODO: Replace with auto-generated type when OpenAPI schema is updated
 */
export interface HydrateBlocksRequest {
    blockIds: string[];
    organisationId: string;
}

/**
 * Result of hydrating a single block's entity references.
 *
 * TODO: Replace with auto-generated type when OpenAPI schema is updated
 */
export interface BlockHydrationResult {
    blockId: string;
    references: Reference[];
    error?: string;
}

/**
 * Response containing hydration results for multiple blocks.
 * Map from block ID to its hydration result.
 *
 * TODO: Replace with auto-generated type when OpenAPI schema is updated
 */
export type HydrateBlocksResponse = Record<string, BlockHydrationResult>;

/**
 * Block Service - HTTP API Integration for Block operations
 */
export class BlockService {
    /**
     * Hydrate (resolve entity references for) one or more blocks in a single batched request.
     *
     * This method is used for progressive loading of entity data without fetching everything upfront.
     * Only blocks with entity reference metadata will be hydrated; other blocks are skipped.
     *
     * @param session - User session for authentication
     * @param blockIds - Array of block UUIDs to hydrate
     * @param organisationId - Organisation context for authorization
     * @returns Promise<HydrateBlocksResponse> - Map of block ID to hydration result
     *
     * Backend API:
     * - Endpoint: POST /api/v1/block/environment/hydrate
     * - Request Body: HydrateBlocksRequest
     * - Response: HydrateBlocksResponse (map of blockId to BlockHydrationResult)
     *
     * @example
     * const results = await BlockService.hydrateBlocks(
     *   session,
     *   ["block-uuid-1", "block-uuid-2"],
     *   "org-uuid"
     * );
     *
     * // Access results per block
     * const block1Result = results["block-uuid-1"];
     * if (block1Result && !block1Result.error) {
     *   console.log(block1Result.references); // Resolved entities
     * }
     */
    static async hydrateBlocks(
        session: Session | null,
        blockIds: string[],
        organisationId: string
    ): Promise<HydrateBlocksResponse> {
        try {
            // Validate inputs
            if (!blockIds || blockIds.length === 0) {
                throw fromError({
                    message: "At least one block ID is required",
                    status: 400,
                    error: "MISSING_PARAMETERS",
                });
            }

            validateSession(session);
            validateUuid(organisationId);
            blockIds.forEach(validateUuid);

            const url = api();
            const request: HydrateBlocksRequest = {
                blockIds,
                organisationId,
            };

            const response = await fetch(`${url}/v1/block/environment/hydrate`, {
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

            throw await handleError(
                response,
                (res) => `Failed to hydrate blocks: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }
}
