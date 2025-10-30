import { GridStackOptions, GridStackWidget } from "gridstack";
import { BlockNode } from "../../interface/block.interface";

/**
 * Builds the top-level GridStack options (widget list + grid configuration)
 * from a `BlockRenderStructure`.
 */
export const buildGridOptions = (
    node: BlockNode,
    overrides?: Partial<GridStackOptions>
): GridStackOptions => {
    for (const item of display.layoutGrid.items ?? []) {
        const rect = pickRect(item);
        const widget = buildWidgetForComponent({
            componentId: item.id,
            rect,
            display,
            ctx,
            path: item.id,
        });
        if (widget) {
            // Widgets that fail validation/visibility return null and are skipped.
            children.push(widget);
        }
    }

    return {
        sizeToContent: true,
        acceptWidgets: true,
        animate: true,
        ...overrides,
        children,
    };
};

const getChildren = (node: BlockNode): GridStackWidget[] | undefined => {
    if (node.type == "reference_node") return;
    if (!node.block.type.nesting) return;
    
};
