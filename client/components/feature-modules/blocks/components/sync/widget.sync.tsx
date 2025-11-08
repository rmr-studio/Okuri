import { GridStackWidget } from "gridstack";
import { useEffect, useMemo, useRef } from "react";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useGrid } from "../../context/grid-provider";
import { isContentNode } from "../../interface/block.interface";
import { WidgetRenderStructure } from "../../interface/render.interface";
import { getDefaultDimensions } from "../../util/block/block.util";
import { findNodeById, getTreeId } from "../../util/environment/environment.util";
import { isList } from "../../util/list/list.util";
import { hasWildcardSlots } from "../../util/render/binding.resolver";
import { parseContent } from "../../util/render/render.util";

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
        isInitialized,
        setIsInitialized,
    } = useBlockEnvironment();

    // Track ALL block IDs in the environment (not just top-level)
    const allBlockIds = useMemo(() => {
        return new Set(blockEnvironment.treeIndex.keys());
    }, [blockEnvironment.treeIndex]);

    // Track previous state
    const prevBlockIdsRef = useRef(new Set<string>());
    const hasInitiallyLoadedRef = useRef(false);

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

        const addNewWidget = (id: string) => {
            if (widgetExists(id)) {
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

            const { x, y, width, height } = getDefaultDimensions(blockNode);
            const parentId = getParentId(id);

            let meta: WidgetRenderStructure;
            const widgetConfig: GridStackWidget = {
                id: id,
                x: x,
                y: y,
                w: width,
                h: height,
            };

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
                    widgetConfig.subGridOpts = {
                        draggable: {
                            cancel: ".block-no-drag",
                            pause: 200,
                        },
                        sizeToContent: true,
                        column: 12,
                        // cellHeight: 40,
                        margin: 8,
                        acceptWidgets: true,
                        animate: true,
                        class: "grid-stack-subgrid",
                        children: [],
                    };
                }
            }

            if (!parentId) {
                // Top-level block - add to main grid
                console.log(`Adding top-level widget ${id} to GridStack`);
                const { success, node } = addWidget(widgetConfig, meta);
                if (!success) {
                    console.warn(`Failed to add widget ${id} to GridStack`);
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
                console.log(
                    `Parent widget ${parentId} is a list item. Child widget ${id} will be rendered as part of the list.`
                );
                return;
            }

            console.log(`Adding nested widget ${id} to parent ${parentId} subgrid`);
            const { success: insertionSuccess, node } = addWidget(widgetConfig, meta, parent);

            if (!insertionSuccess) {
                console.warn(`Failed to add widget ${id} to parent ${parentId} subgrid`);
            }
            return;
        };

        // Add new widgets
        addedBlockIds.forEach((blockId) => {
            addNewWidget(blockId);
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
            console.log(
                "[GridStackWidgetSync] Initial grid load complete, environment initialized"
            );
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
    ]);

    return null;
};
