import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";
import { BlockEnvironment } from "../interface/block.interface";
import { SaveEnvironmentRequest, SaveEnvironmentResponse } from "../interface/command.interface";

/**
 * Layout Service - HTTP API Integration for Block Environment operations
 */
export class LayoutService {
    /**
     * Load a specific layout for an entity
     *
     * @param entityId - UUID of the entity (client, invoice, etc.)
     * @Param entityType - Type of entity (CLIENT, INVOICE, PROJECT)
     * @returns Promise<BlockEnvironment>
     *
     * Backend API:
     * - Endpoint: GET /api/v1/block/environment/type/:entityType/id/:entityId
     * - Response: BlockEnvironment object
     */
    static async loadLayout(entityId: string, entityType: string): Promise<BlockEnvironment> {
        console.log(`[STUB] LayoutService.loadLayout(${entityId}, ${entityType})`);
        throw Error("Not implemented");
    }

    /**
     * Saves the current layout snapshot to the backend with all pending changes
     *
     * This is called when:
     * - User clicks "Save All" with pending layout changes
     *
     * @param session - User session for authentication
     * @param request - All data needed to save the layout
     * @returns Promise<SaveEnvironmentResponse>
     *
     * Backend API:
     * - Endpoint: POST /api/v1/block/environment/
     * - Request Body:  SaveEnvironmentRequest
     * - Response: SaveEnvironmentResponse
     */
    static async saveLayoutSnapshot(
        session: Session | null,
        request: SaveEnvironmentRequest
    ): Promise<SaveEnvironmentResponse> {
        try {
            validateSession(session);
            const url = api();
            const response = await fetch(`${url}/v1/block/environment/`, {
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
                (res) => `Failed to save block layout: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }
}
