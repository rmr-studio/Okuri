import { GridItemHTMLElement, GridStackOptions, GridStackWidget } from "gridstack";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useGrid } from "../../context/grid-provider";
import { isContentNode } from "../../interface/block.interface";
import { WidgetRenderStructure } from "../../interface/render.interface";
import { getDefaultDimensions } from "../../util/block/block.util";
import { findNodeById, getTreeId } from "../../util/environment/environment.util";
import { isList } from "../../util/list/list.util";
import { hasWildcardSlots } from "../../util/render/binding.resolver";
import { parseContent } from "../../util/render/render.util";
import { DEFAULT_WIDGET_OPTIONS } from "../demo/block-demo";

/**
 * Recursively extracts all widget configurations from a layout, including nested subgrids.
 * Returns a map of widgetId -> GridStackWidget for quick lookup and a parent map.
 */
function buildLayoutWidgetMap(layout?: GridStackOptions): {
    widgetMap: Map<string, GridStackWidget>;
    parentMap: Map<string, string>;
} {
    const widgetMap = new Map<string, GridStackWidget>();
    const parentMap = new Map<string, string>();
    if (!layout?.children) return { widgetMap, parentMap };

    const processChildren = (children: GridStackWidget[], parentId?: string) => {
        children.forEach((widget) => {
            if (widget.id) {
                widgetMap.set(widget.id, widget);
                if (parentId) {
                    parentMap.set(widget.id, parentId);
                }
            }
            // Recursively process subgrid children
            if (widget.subGridOpts?.children && widget.id) {
                processChildren(widget.subGridOpts.children, widget.id);
            }
        });
    };

    processChildren(layout.children);
    return { widgetMap, parentMap };
}

/**
 * Synchronizes GridStack widgets when blocks change at any level of the tree.
 *
 * Handles:
 * - Adding new top-level blocks to the main grid
 * - Adding nested blocks to parent subgrids
 * - Removing blocks and their descendants from widget map
 * - Maintaining 1:1 widget-to-block mapping
 */
export const WidgetEnvironmentSync: React.FC = () => {
    const {
        gridStack,
        environment: gridEnvironment,
        addWidget,
        removeWidget,
        widgetExists,
        findWidget,
    } = useGrid();
    const {
        getTrees,
        getParentId,
        environment: blockEnvironment,
        initialLayout,
        isInitialized,
        setIsInitialized,
    } = useBlockEnvironment();

    // Build a map of widget configurations from the provided layout
    const { widgetMap: layoutWidgetMap, parentMap: layoutParentMap } = useMemo(
        () => buildLayoutWidgetMap(initialLayout),
        [initialLayout]
    );

    // Track ALL block IDs in the environment (not just top-level)
    const allBlockIds = useMemo(() => {
        return new Set(blockEnvironment.treeIndex.keys());
    }, [blockEnvironment.treeIndex]);

    // Track previous state
    const prevBlockIdsRef = useRef(new Set<string>());
    const hasInitiallyLoadedRef = useRef(false);

    const triggerSubgridResize = useCallback((element?: HTMLElement | null) => {
        try {
            const gridItem = element as GridItemHTMLElement | null;
            const subGrid = gridItem?.gridstackNode?.subGrid;
            if (!subGrid) return;

            // Guard against invalid subgrid instances
            if (!subGrid.engine || !subGrid.opts) return;

            requestAnimationFrame(() => {
                try {
                    if (!gridItem?.isConnected) return;
                    if (!subGrid.engine || !subGrid.opts) return;
                    subGrid.onResize();
                } catch (error) {
                    // Catch errors during subgrid resize
                    console.debug("Subgrid resize error (non-critical):", error);
                }
            });
        } catch (error) {
            // Catch any errors in the outer scope
            console.debug("Trigger subgrid resize error (non-critical):", error);
        }
    }, []);

    useEffect(() => {
        if (!gridStack) return;

        const currentBlockIds = allBlockIds;
        const prevBlockIds = prevBlockIdsRef.current;

        // Find blocks that were added
        const addedBlockIds = Array.from(currentBlockIds).filter(
            (id: string) => !prevBlockIds.has(id)
        );

        // Find blocks that were removed
        const removedBlockIds = Array.from(prevBlockIds).filter(
            (id: string) => !currentBlockIds.has(id)
        );

        // Find missing blocks: blocks referenced in layout but not in block environment
        const missingBlockIds: string[] = [];
        if (layoutWidgetMap.size > 0 && !hasInitiallyLoadedRef.current) {
            layoutWidgetMap.forEach((widget, widgetId) => {
                // Skip placeholder widgets
                if (widgetId.endsWith("-placeholder")) return;
                // If widget is in layout but not in block environment, it's missing
                if (!currentBlockIds.has(widgetId)) {
                    missingBlockIds.push(widgetId);
                }
            });
        }

        const addNewWidget = (id: string) => {
            // Ignore placeholder widgets used to keep subgrids active when empty
            if (id.endsWith("-placeholder")) {
                return;
            }

            if (widgetExists(id)) {
                return;
            }

            // If this block exists in the layout, skip it
            // GridStack has already initialized it from initialOptions
            if (layoutWidgetMap.has(id)) {
                return;
            }

            // Find the block tree containing this block
            const treeId = blockEnvironment.treeIndex.get(id);
            if (!treeId) return;

            const tree = getTrees().find((t) => getTreeId(t) === treeId);
            if (!tree) return;

            // Find the block node
            const blockNode = findNodeById(tree.root, id);
            if (!blockNode) return;

            const parentId = getParentId(id);

            // Use default dimensions for new blocks (not in layout)
            const { x, y, width, height } = getDefaultDimensions(blockNode);

            // Calculate proper Y coordinate based on sibling order to prevent reverse rendering
            let calculatedY = y;
            if (!parentId) {
                // For root blocks, calculate Y based on position in trees array
                const trees = getTrees();
                const treeIndex = trees.findIndex((t) => getTreeId(t) === treeId);
                if (treeIndex >= 0) {
                    calculatedY = treeIndex * 10; // Space out root blocks
                }
            } else {
                // For child blocks, calculate Y based on position in parent's children array
                const parentNode = findNodeById(tree.root, parentId);
                if (parentNode && isContentNode(parentNode) && parentNode.children) {
                    const childIndex = parentNode.children.findIndex(
                        (child) => child.block.id === id
                    );
                    if (childIndex >= 0) {
                        calculatedY = childIndex * 10; // Space out child blocks
                    }
                }
            }

            const widgetConfig: GridStackWidget = {
                id: id,
                x: x,
                y: calculatedY,
                w: width,
                h: height,
            };

            let meta: WidgetRenderStructure;

            // Base definition for widget metadata
            meta = {
                id: id,
                key: blockNode.block.type.key,
                renderType: "component",
                blockType: blockNode.type,
            };

            // Special handling for list/container blocks blocks => We render them differently
            if (isList(blockNode)) {
                meta.renderType = "list";
            } else {
                // Check if this block should have a subgrid (for blocks with wildcard slots)
                const renderStructure = blockNode.block.type.display.render;
                const hasWildcards = Object.values(renderStructure.components || {}).some(
                    (component) => hasWildcardSlots(component)
                );

                if (hasWildcards && isContentNode(blockNode)) {
                    meta.renderType = "container";

                    // Add subgrid configuration - children will be added separately by the sync logic
                    // Include a placeholder widget to keep the subgrid active when empty
                    // This prevents GridStack from collapsing/destroying empty subgrids
                    widgetConfig.subGridOpts = {
                        ...DEFAULT_WIDGET_OPTIONS,
                        class: "grid-stack-subgrid",
                        column: "auto",
                        columnOpts: {
                            breakpointForWindow: true,
                            breakpoints: [
                                {
                                    w: 732,
                                    c: 1,
                                },
                            ],
                        },
                        children: [
                            {
                                id: `${id}-placeholder`,
                                x: 0,
                                y: 0,
                                w: 12,
                                h: 0, // Zero height to make it invisible
                                locked: true,
                                noMove: true,
                                noResize: true,
                            },
                        ],
                    };
                }
            }

            if (!parentId) {
                const { success, node } = addWidget(widgetConfig, meta);
                if (!success || !node?.el) {
                    console.warn(`Failed to add widget ${id} to GridStack`);
                    return;
                }
                return;
            }

            // Nested block - add to parent's subgrid
            // Need to search recursively through subgrids to find the parent
            const { success: querySuccess, node: parent } = findWidget(parentId);
            if (!querySuccess || !parent) {
                console.warn(
                    `Parent widget ${parentId} not found for child ${id}. Widget not added.`
                );
                return;
            }

            // Dont render list item widgets directly - they are part of the list's rendering
            const parsedParentMeta = parseContent(parent);
            if (!parsedParentMeta) return;
            if (parsedParentMeta.renderType === "list") {
                return;
            }

            const { success: insertionSuccess, node } = addWidget(widgetConfig, meta, parent);

            if (!insertionSuccess || !node?.el) {
                console.warn(`Failed to add widget ${id} to parent ${parentId} subgrid`);
                return;
            }

            return;
        };

        const addMissingBlockWidget = (id: string) => {
            if (widgetExists(id)) return;

            const layoutWidget = layoutWidgetMap.get(id);
            if (!layoutWidget) return;

            // Create error widget with layout dimensions
            const widgetConfig: GridStackWidget = {
                id: id,
                x: layoutWidget.x ?? 0,
                y: layoutWidget.y ?? 0,
                w: layoutWidget.w ?? 12,
                h: layoutWidget.h ?? 4,
            };

            const meta: WidgetRenderStructure = {
                id: id,
                key: "error",
                renderType: "component",
                blockType: "error",
            };

            // Resolve parent node (if any) to place error widget in the correct grid
            const parentId = layoutParentMap.get(id);
            if (parentId) {
                const { success: querySuccess, node: parent } = findWidget(parentId);
                if (!querySuccess || !parent) {
                    console.warn(
                        `Parent widget ${parentId} not found for missing block ${id}. Widget not added.`
                    );
                    return;
                }

                const { success, node } = addWidget(widgetConfig, meta, parent);
                if (!success || !node?.el) {
                    console.warn(`Failed to add error widget for missing block ${id} to parent ${parentId}`);
                }
            } else {
                // No parent - add to root grid
                const { success, node } = addWidget(widgetConfig, meta);
                if (!success || !node?.el) {
                    console.warn(`Failed to add error widget for missing block ${id}`);
                }
            }
        };

        // Add new widgets
        addedBlockIds.forEach((blockId) => {
            addNewWidget(blockId);
        });

        // Add error widgets for missing blocks (only on initial load)
        missingBlockIds.forEach((blockId) => {
            addMissingBlockWidget(blockId);
        });

        // Remove old widgets
        removedBlockIds.forEach((blockId) => {
            removeWidget(blockId);
        });

        // Update the ref for next render
        prevBlockIdsRef.current = new Set(currentBlockIds);

        // Mark as initialized after the first load completes
        if (!hasInitiallyLoadedRef.current && !isInitialized) {
            hasInitiallyLoadedRef.current = true;
            setIsInitialized(true);
        }
    }, [
        gridStack,
        allBlockIds,
        blockEnvironment,
        gridEnvironment,
        getParentId,
        isInitialized,
        setIsInitialized,
        removeWidget,
        findWidget,
        addWidget,
        triggerSubgridResize,
        layoutWidgetMap,
        layoutParentMap,
        widgetExists,
        getTrees,
    ]);

    return null;
};
