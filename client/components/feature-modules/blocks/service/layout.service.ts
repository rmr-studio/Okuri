import { EntityType } from "@/lib/types/types";
import { formatError, fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
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
     * @param session - User session for authentication
     * @param entityId - UUID of the entity (client, invoice, etc.)
     * @param entityType - Type of entity (CLIENT, INVOICE, PROJECT)
     * @returns Promise<BlockEnvironment>
     *
     * Backend API:
     * - Endpoint: GET /api/v1/block/environment/type/:entityType/id/:entityId
     * - Response: BlockEnvironment object
     */
    static async loadLayout(
        session: Session | null,
        organisationId: string | undefined,
        entityId: string | undefined,
        entityType: EntityType
    ): Promise<BlockEnvironment> {
        console.log(entityType);
        try {
            if (!organisationId || !entityId) {
                throw fromError({
                    message: "Organisation ID and Entity ID are required to load layout",
                    status: 400,
                    error: "MISSING_PARAMETERS",
                });
            }

            validateUuid(organisationId);
            validateUuid(entityId);
            validateSession(session);

            const url = api();
            const response = await fetch(
                `${url}/v1/block/environment/organisation/${organisationId}/type/${entityType}/id/${entityId}`,
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

            const err = await handleError(
                response,
                (res) => `Failed to load block environment: ${res.status} ${res.statusText}`
            );
            console.error("Failed to load layout:", formatError(err));
            throw err;
        } catch (error) {
            if (isResponseError(error)) {
                console.error("Failed to load layout:", formatError(error));
                throw error;
            }
            const err = fromError(error);
            console.error("Failed to load layout:", formatError(err));
            throw err;
        }
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
        console.log(request);
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

            const err = await handleError(
                response,
                (res) => `Failed to save block layout: ${res.status} ${res.statusText}`
            );
            console.error("Failed to save layout:", formatError(err));
            throw err;
        } catch (error) {
            if (isResponseError(error)) {
                console.error("Failed to save layout:", formatError(error));
                throw error;
            }
            const err = fromError(error);
            console.error("Failed to save layout:", formatError(err));
            throw err;
        }
    }
}
