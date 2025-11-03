import { GridStack, GridStackNode, GridStackOptions, GridStackWidget } from "gridstack";
import { GridEnvironment } from "../../interface/grid.interface";
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

export const init = (
    options: GridStackOptions,
    widgets?: Map<string, GridStackWidget>
): GridEnvironment => {
    // If a pre-built widget map is provided, use it directly
    if (widgets) {
        return buildEnvironment(widgets);
    }

    // Otherwise, build the map by recursively scanning initialOptions.children
    const widgetMap = buildWidgets(options);
    return buildEnvironment(widgetMap);
};

/**
 * Recursively builds a map of widget IDs to their corresponding GridStackWidget objects.
 *
 * @param options - The GridStackOptions object containing the initial widget configuration.
 * @returns A Map of widget IDs to their corresponding GridStackWidget objects.
 */
const buildWidgets = (options: GridStackOptions): Map<string, GridStackWidget> => {
    const map = new Map<string, GridStackWidget>();
    const deepFindNodeWithContent = (obj: GridStackWidget) => {
        if (obj.id && obj.content) {
            map.set(obj.id, obj);
        }
        if (obj.subGridOpts?.children) {
            obj.subGridOpts.children.forEach((child: GridStackWidget) => {
                deepFindNodeWithContent(child);
            });
        }
    };
    options.children?.forEach((child: GridStackWidget) => {
        deepFindNodeWithContent(child);
    });
    return map;
};

/**
 * Scan through the Widget Map to build lookup structures for the Grid Environment.
 * @param widgets
 */
const buildEnvironment = (widgets: Map<string, GridStackWidget>): GridEnvironment => {
    const hierarchy = new Map<string, string | null>();
    const treeIndex = new Map<string, string>();
    const visited = new Set<string>();
    const childIds = new Set<string>();
    const rootSet = new Set<string>();
    const roots: string[] = [];

    const registerRoot = (id: string) => {
        if (rootSet.has(id)) return;
        rootSet.add(id);
        roots.push(id);
    };

    // Record all child relationships encountered in subgrid definitions
    widgets.forEach((widget) => {
        widget.subGridOpts?.children?.forEach((child) => {
            if (child.id) {
                childIds.add(child.id);
            }
        });
    });

    // Determine root widgets (those that never appear as children)
    widgets.forEach((_widget, id) => {
        if (!childIds.has(id)) {
            registerRoot(id);
        }
    });

    const traverse = (widgetId: string, parentId: string | null, rootId: string) => {
        if (visited.has(widgetId)) return;
        visited.add(widgetId);

        hierarchy.set(widgetId, parentId);
        treeIndex.set(widgetId, rootId);

        const widget = widgets.get(widgetId);
        if (!widget) return;

        widget.subGridOpts?.children?.forEach((child) => {
            if (!child.id) return;
            traverse(child.id, widgetId, rootId);
        });
    };

    // Walk each root and register descendants
    roots.forEach((rootId) => traverse(rootId, null, rootId));

    // Handle any orphaned widgets not connected to a detected root
    widgets.forEach((_widget, id) => {
        if (visited.has(id)) return;
        traverse(id, null, id);
        registerRoot(id);
    });

    return {
        hierarchy,
        treeIndex,
        widgetMetaMap: widgets,
    };
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
    <div class="grid-stack-item-content">
      <span class="block-drag-handle pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
            aria-hidden="true"
            data-block-drag-handle-stub="true"></span>
      <script type="application/json" data-block-meta="true">${json}</script>
    </div>
  `;
};
