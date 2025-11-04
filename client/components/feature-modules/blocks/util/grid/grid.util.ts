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
    if (!item.grid) return null;
    if (item.grid === gridStack) return null;

    return item.grid.parentGridNode?.id ?? null;
};
