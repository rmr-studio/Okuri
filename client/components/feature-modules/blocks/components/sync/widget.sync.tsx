import { GridStackWidget } from "gridstack";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useGrid } from "../../context/grid-provider";
import { isContentNode, isEntityReferenceMetadata } from "../../interface/block.interface";
import { getCurrentDimensions } from "../../util/block/block.util";
import { findNodeById, getTreeId } from "../../util/environment/environment.util";
import { isList } from "../../util/list/list.util";
import { hasWildcardSlots } from "../../util/render/binding.resolver";

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

    useLayoutEffect(() => {
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

        // Add new widgets
        addedBlockIds.forEach((blockId) => {
            if (widgetExists(blockId)) {
                return;
            }

            // Find the block tree containing this block
            const treeId = blockEnvironment.treeIndex.get(blockId);
            if (!treeId) return;

            const tree = getTrees().find((t) => getTreeId(t) === treeId);
            if (!tree) return;

            // Find the block node
            const blockNode = findNodeById(tree.root, blockId);
            if (!blockNode) return;

            const layout = blockNode.block.layout ?? getCurrentDimensions(blockNode);
            const parentId = getParentId(blockId);
            const type = isEntityReferenceMetadata(blockNode.block.payload) ? "reference" : "block";

            const widgetConfig: GridStackWidget = {
                id: blockId,
                x: layout.x,
                y: layout.y,
                w: layout.width,
                h: layout.height,
                content: JSON.stringify({
                    id: blockId,
                    key: blockNode.block.type.key,
                    renderType: "component",
                    blockType: type,
                }),
            };

            // Special handling for list blocks => We render them differently
            if (isList(blockNode)) {
                return {
                    ...widgetConfig,
                    // Update Content to include list renderType
                    content: JSON.stringify({
                        id: blockId,
                        key: blockNode.block.type.key,
                        renderType: "list",
                        blockType: type,
                    }),
                };
            }

            // Check if this block should have a subgrid (for blocks with wildcard slots)
            const renderStructure = blockNode.block.type.display.render;
            const hasWildcards = Object.values(renderStructure.components || {}).some((component) =>
                hasWildcardSlots(component)
            );

            if (hasWildcards && isContentNode(blockNode)) {
                widgetConfig.content = JSON.stringify({
                    id: blockId,
                    key: blockNode.block.type.key,
                    renderType: "container",
                    blockType: type,
                });
                // Add subgrid configuration - children will be added separately by the sync logic
                widgetConfig.subGridOpts = {
                    handle: ".block-drag-handle",
                    draggable: {
                        handle: ".block-drag-handle", // Only allow dragging via the drag handle
                    },
                    column: 12,
                    cellHeight: 40,
                    margin: 8,
                    acceptWidgets: true,
                    animate: true,
                    class: "grid-stack-subgrid",
                    children: [],
                };
            }

            if (!parentId) {
                // Top-level block - add to main grid
                console.log(`Adding top-level widget ${blockId} to GridStack`);
                addWidget(widgetConfig);
            } else {
                // Nested block - add to parent's subgrid
                // Need to search recursively through subgrids to find the parent
                const { success, node: parent } = findWidget(parentId);
                if (!success || !parent) {
                    console.warn(
                        `Parent widget ${parentId} not found for child ${blockId}. Widget not added.`
                    );
                    return;
                }

                console.log(`Adding nested widget ${blockId} to parent ${parentId} subgrid`);
                addWidget(widgetConfig, parent);

                const findNodeRecursively = (
                    nodes: Array<{ id?: string; subGrid?: { engine?: { nodes?: unknown[] } } }>
                ): { id?: string; subGrid?: unknown } | null => {
                    for (const node of nodes) {
                        if (node.id === parentId) {
                            return node;
                        }
                        if (node.subGrid?.engine?.nodes) {
                            const found = findNodeRecursively(
                                node.subGrid.engine.nodes as Array<{
                                    id?: string;
                                    subGrid?: { engine?: { nodes?: unknown[] } };
                                }>
                            );
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const parentNode = gridStack.engine.nodes
                    ? findNodeRecursively(gridStack.engine.nodes)
                    : null;
                const parentSubGrid = parentNode?.subGrid;

                if (parentSubGrid) {
                    parentSubGrid.addWidget(widgetConfig);
                } else {
                    console.warn(
                        `Parent ${parentId} has no subgrid for child ${blockId}. Widget not added.`
                    );
                    return;
                }
            }

            // Update rawWidgetMetaMap so RenderElementProvider can find it
            _rawWidgetMetaMap.set((prev) => {
                const newMap = new Map(prev);
                newMap.set(blockId, widgetConfig);
                return newMap;
            });
        });

        // Remove old widgets
        removedBlockIds.forEach((blockId) => {
            console.log(`Removing widget ${blockId} from GridStack`);

            // Find the node and its owning grid instance recursively
            const findNodeAndGrid = (
                nodes: Array<{
                    id?: string;
                    el?: HTMLElement;
                    subGrid?: { engine?: { nodes?: unknown[] } } & { removeWidget?: unknown };
                }>,
                owningGrid: typeof gridStack
            ): { node: unknown; grid: typeof gridStack } | null => {
                for (const node of nodes) {
                    if (String(node.id) === blockId) {
                        return { node, grid: owningGrid };
                    }
                    if (node.subGrid?.engine?.nodes) {
                        const found = findNodeAndGrid(
                            node.subGrid.engine.nodes as Array<{
                                id?: string;
                                el?: HTMLElement;
                                subGrid?: { engine?: { nodes?: unknown[] } } & {
                                    removeWidget?: unknown;
                                };
                            }>,
                            node.subGrid as unknown as typeof gridStack
                        );
                        if (found) return found;
                    }
                }
                return null;
            };

            const result = gridStack.engine.nodes
                ? findNodeAndGrid(gridStack.engine.nodes, gridStack)
                : null;

            if (result) {
                const { node, grid } = result;
                const element = (node as { el?: HTMLElement }).el;
                if (element && grid.removeWidget) {
                    grid.removeWidget(element, true);
                    console.log(`Successfully removed widget ${blockId} from its grid`);
                }
            } else {
                console.warn(`Could not find widget ${blockId} in GridStack to remove`);
            }

            // Remove from rawWidgetMetaMap (descendants are handled by GridProvider's removeWidget)
            _rawWidgetMetaMap.set((prev) => {
                const newMap = new Map(prev);
                newMap.delete(blockId);
                return newMap;
            });
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
        environment,
        getParentId,
        _rawWidgetMetaMap,
        isInitialized,
        setIsInitialized,
    ]);

    return null;
};

const findGridstackNode = () => {};
