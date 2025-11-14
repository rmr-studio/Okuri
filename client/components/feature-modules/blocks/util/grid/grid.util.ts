import { GridStack, GridStackNode } from "gridstack";

/**
 * This will take in a Gridstack node that has recently been added to a new grid position (ie. Moved into a sub grid or moved out to a parent grid)
 * and determine what the new parent block ID should be.
 *
 * @param item
 * @param gridStack
 * @returns
 */
export const getNewParentId = (item: GridStackNode, gridStack: GridStack): string | null => {
    try {
        if (!item || !item.grid) return null;
        if (item.grid === gridStack) return null;

        // Guard against invalid grid state during resize operations
        if (!item.grid.parentGridNode) return null;

        return item.grid.parentGridNode.id ?? null;
    } catch (error) {
        // Catch any errors accessing grid properties during transitions
        console.debug("getNewParentId error (non-critical):", error);
        return null;
    }
};
