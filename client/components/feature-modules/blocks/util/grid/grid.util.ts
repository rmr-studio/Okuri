import { GridStack, GridStackNode } from "gridstack";
import { WidgetRenderStructure } from "../../interface/render.interface";

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

/**
 * When adding a new widget to the grid, this ensures that a drag handle stub is added
 * to allow for proper dragging behavior. As Gridstack requires the specified handle class to be present during
 * init, otherwise will default to making the entire item draggable.
 *
 * @param gridItem - The widget that is being added to the grid
 */
export const createWidgetMetadata = (meta: WidgetRenderStructure): string => {
    const json = JSON.stringify(meta).replace(/</g, "\\u003c");
    return `
    <div className="grid-stack-item-content">
      <script type="application/json" data-block-meta="true">${json}</script>
    </div>
  `;
};
