import { GridStackOptions } from "gridstack";
import { BlockTreeLayout } from "../interface/layout.interface";

/**
 * Layout Service - API integration stubs for BlockTreeLayout persistence
 *
 * These are placeholder functions to be implemented with TanStack Query.
 * Each function documents the expected API endpoint, request shape, and response.
 */
export class LayoutService {
    /**
     * Load a specific layout by ID
     *
     * TanStack Query Implementation:
     * ```typescript
     * const { data: layout } = useQuery({
     *   queryKey: ['layout', layoutId],
     *   queryFn: () => LayoutService.loadLayout(layoutId)
     * });
     * ```
     *
     * @param layoutId - UUID of the layout to load
     * @returns Promise<BlockTreeLayout>
     *
     * Backend API:
     * - Endpoint: GET /api/block-tree-layouts/:layoutId
     * - Response: BlockTreeLayout object
     */
    static async loadLayout(layoutId: string): Promise<BlockTreeLayout> {
        console.log(`[STUB] LayoutService.loadLayout(${layoutId})`);
        // TODO: Implement with TanStack Query
        // Example:
        // const response = await fetch(`/api/block-tree-layouts/${layoutId}`);
        // return response.json();
        throw new Error("Not implemented - use TanStack Query");
    }

    /**
     * Save/update only the GridStack layout snapshot
     *
     * This is called when:
     * - User clicks "Save All" with pending layout changes
     * - After a re-parenting operation (immediate persistence)
     *
     * TanStack Query Implementation:
     * ```typescript
     * const { mutate: saveLayout } = useMutation({
     *   mutationFn: ({ layoutId, layout }) =>
     *     LayoutService.saveLayoutSnapshot(layoutId, layout),
     *   onSuccess: () => {
     *     queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
     *   }
     * });
     * ```
     *
     * @param layoutId - UUID of the layout to update
     * @param layout - Complete GridStackOptions object to persist
     * @returns Promise<void>
     *
     * Backend API:
     * - Endpoint: PUT /api/block-tree-layouts/:layoutId/layout
     * - Request Body: { layout: GridStackOptions }
     * - Response: { success: boolean, updatedAt: string }
     */
    static async saveLayoutSnapshot(
        layoutId: string,
        layout: GridStackOptions
    ): Promise<void> {
        console.log(`[STUB] LayoutService.saveLayoutSnapshot(${layoutId})`, layout);
        // TODO: Implement with TanStack Query mutation
        // Example:
        // await fetch(`/api/block-tree-layouts/${layoutId}/layout`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ layout })
        // });
        throw new Error("Not implemented - use TanStack Query");
    }

    /**
     * Resolve the best layout for an entity based on scope priority
     *
     * Resolution order:
     * 1. User-specific layout (if userId provided and exists)
     * 2. Team layout (if teamId provided and user is in team)
     * 3. Organization default layout
     *
     * TanStack Query Implementation:
     * ```typescript
     * const { data: layout } = useQuery({
     *   queryKey: ['layout', 'resolve', entityId, entityType, userId, teamId],
     *   queryFn: () => LayoutService.loadLayoutForEntity({
     *     entityId, entityType, userId, teamId
     *   })
     * });
     * ```
     *
     * @param params - Entity and user/team context
     * @returns Promise<BlockTreeLayout>
     *
     * Backend API:
     * - Endpoint: GET /api/block-tree-layouts/resolve
     * - Query Params:
     *   - entityId: UUID of the entity (client, invoice, etc.)
     *   - entityType: Type of entity (CLIENT, INVOICE, PROJECT)
     *   - userId?: UUID of current user (optional)
     *   - teamId?: UUID of user's team (optional)
     * - Response: BlockTreeLayout (with highest priority scope)
     * - Logic: Backend handles scope resolution and returns most specific layout
     */
    static async loadLayoutForEntity(params: {
        entityId: string;
        entityType: string;
        userId?: string;
        teamId?: string;
    }): Promise<BlockTreeLayout> {
        console.log("[STUB] LayoutService.loadLayoutForEntity", params);
        // TODO: Implement with TanStack Query
        // Example:
        // const queryParams = new URLSearchParams({
        //   entityId: params.entityId,
        //   entityType: params.entityType,
        //   ...(params.userId && { userId: params.userId }),
        //   ...(params.teamId && { teamId: params.teamId })
        // });
        // const response = await fetch(`/api/block-tree-layouts/resolve?${queryParams}`);
        // return response.json();
        throw new Error("Not implemented - use TanStack Query");
    }

    /**
     * Create a new layout (e.g., when user customizes organization default)
     *
     * TanStack Query Implementation:
     * ```typescript
     * const { mutate: createLayout } = useMutation({
     *   mutationFn: (layout: Omit<BlockTreeLayout, 'id'>) =>
     *     LayoutService.createLayout(layout),
     *   onSuccess: (newLayout) => {
     *     queryClient.setQueryData(['layout', newLayout.id], newLayout);
     *   }
     * });
     * ```
     *
     * @param layout - Layout data without ID (ID assigned by backend)
     * @returns Promise<BlockTreeLayout> - Created layout with ID
     *
     * Backend API:
     * - Endpoint: POST /api/block-tree-layouts
     * - Request Body: BlockTreeLayout (without id, createdAt, updatedAt)
     * - Response: BlockTreeLayout (with id, timestamps)
     */
    static async createLayout(
        layout: Omit<BlockTreeLayout, "id" | "createdAt" | "updatedAt">
    ): Promise<BlockTreeLayout> {
        console.log("[STUB] LayoutService.createLayout", layout);
        // TODO: Implement with TanStack Query mutation
        throw new Error("Not implemented - use TanStack Query");
    }
}
