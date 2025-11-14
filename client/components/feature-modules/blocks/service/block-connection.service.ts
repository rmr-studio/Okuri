/**
 * Block Connection Service - API integration stubs for block hierarchy management
 *
 * These are placeholder functions to be implemented with TanStack Query.
 * Handles the block_connections table that stores parent-child relationships.
 */
export class BlockConnectionService {
    /**
     * Update a block's parent (re-parenting operation)
     *
     * This is called immediately when a block is dragged to a new parent.
     * It updates the block_connections table to reflect the new hierarchy.
     *
     * TanStack Query Implementation:
     * ```typescript
     * const { mutate: reparentBlock } = useMutation({
     *   mutationFn: ({ blockId, parentId, layoutId }) =>
     *     BlockConnectionService.updateBlockParent(blockId, parentId, layoutId),
     *   onSuccess: () => {
     *     queryClient.invalidateQueries({ queryKey: ['blocks'] });
     *     queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
     *   }
     * });
     * ```
     *
     * @param blockId - UUID of the block being moved
     * @param newParentId - UUID of new parent (null for top-level)
     * @param layoutId - UUID of the layout context
     * @returns Promise<void>
     *
     * Backend API:
     * - Endpoint: PUT /api/block-connections/:blockId/parent
     * - Request Body:
     *   {
     *     parentId: string | null,  // null = promote to top-level
     *     layoutId: string           // for context/validation
     *   }
     * - Response: { success: boolean }
     * - Side Effects:
     *   - Updates block_connections table
     *   - May trigger CASCADE updates for child blocks
     *   - Validates that new parent can accept children
     */
    static async updateBlockParent(
        blockId: string,
        newParentId: string | null,
        layoutId: string
    ): Promise<void> {
        console.log(
            `[STUB] BlockConnectionService.updateBlockParent(${blockId} -> ${newParentId}) in layout ${layoutId}`
        );
        // TODO: Implement with TanStack Query mutation
        // Example:
        // await fetch(`/api/block-connections/${blockId}/parent`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ parentId: newParentId, layoutId })
        // });
        throw new Error("Not implemented - use TanStack Query");
    }

    /**
     * Get all blocks in a layout with their hierarchy
     *
     * This could be used for initial load or validation.
     *
     * TanStack Query Implementation:
     * ```typescript
     * const { data: connections } = useQuery({
     *   queryKey: ['block-connections', layoutId],
     *   queryFn: () => BlockConnectionService.getLayoutConnections(layoutId)
     * });
     * ```
     *
     * @param layoutId - UUID of the layout
     * @returns Promise<BlockConnection[]>
     *
     * Backend API:
     * - Endpoint: GET /api/block-connections/layout/:layoutId
     * - Response: Array of { blockId, parentId, order } objects
     */
    static async getLayoutConnections(
        layoutId: string
    ): Promise<Array<{ blockId: string; parentId: string | null; order: number }>> {
        console.log(`[STUB] BlockConnectionService.getLayoutConnections(${layoutId})`);
        // TODO: Implement with TanStack Query
        throw new Error("Not implemented - use TanStack Query");
    }
}
