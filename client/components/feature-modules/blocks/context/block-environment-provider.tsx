"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { BlockNode, BlockTree, GridRect, isContentNode } from "../interface/block.interface";
import {
    BlockEnvironmentContextValue,
    BlockEnvironmentProviderProps,
    EditorEnvironment,
} from "../interface/editor.interface";
import { getCurrentDimensions } from "../util/block/block.util";
import {
    calculateNextLayout,
    collectDescendantIds,
    createEmptyEnvironment,
    detachNode,
    findNodeById,
    findTree,
    getTreeId,
    init,
    insertNode,
    insertTree,
    persistLayoutOnTree,
    replaceNode,
    traverseTree,
    updateManyTrees,
    updateMetadata,
    updateTrees,
} from "../util/environment/environment.util";

//todo. Maybe migrate to Zustand.

export const BlockEnvironmentContext = createContext<BlockEnvironmentContextValue | null>(null);

type LayoutLike = Partial<GridRect> & { w?: number; h?: number };

const normaliseLayout = (layout: LayoutLike = {}): GridRect => ({
    x: layout.x ?? 0,
    y: layout.y ?? 0,
    width: layout.width ?? layout.w ?? 1,
    height: layout.height ?? layout.h ?? 1,
    locked: layout.locked ?? false,
});

/**
 * Provides state and helpers for the block environment editor.
 */
export const BlockEnvironmentProvider: React.FC<BlockEnvironmentProviderProps> = ({
    organisationId,
    initialTrees,
    children,
}) => {
    const [environment, setEnvironment] = useState<EditorEnvironment>(() =>
        init(organisationId, initialTrees)
    );

    /**
     * Inserts a block under the specified parent/slot, updating all relevant environment maps.
     * @param child The block to insert.
     * @param parentId The ID of the parent block.
     * @param slotName The name of the slot to insert into.
     * @returns The ID of the inserted block.
     */
    const insertBlock = useCallback(
        (
            child: BlockNode,
            parentId: string,
            slotName: string,
            index: number | null = null
        ): string => {
            setEnvironment((prev) => {
                const parentTreeId = prev.treeIndex.get(parentId);
                if (!parentTreeId) {
                    console.warn(`Parent block ${parentId} not found`);
                    return prev;
                }

                const parentTree = findTree(prev, parentTreeId);
                if (!parentTree) {
                    console.warn(`Tree ${parentTreeId} not found for parent ${parentId}`);
                    return prev;
                }

                const layouts = new Map(prev.layouts);
                const hierarchy = new Map(prev.hierarchy);
                const treeIndex = new Map(prev.treeIndex);

                const baseLayout =
                    child.block.layout ?? calculateNextLayout(child, layouts, hierarchy, parentId);
                const layout = normaliseLayout(baseLayout);

                const nodeWithLayout: BlockNode = {
                    ...child,
                    block: {
                        ...child.block,
                        layout,
                    },
                };

                layouts.set(nodeWithLayout.block.id, layout);

                const updatedTree = insertNode(
                    parentTree,
                    parentId,
                    slotName,
                    nodeWithLayout,
                    index
                );
                const treeWithLayout = persistLayoutOnTree(
                    updatedTree,
                    nodeWithLayout.block.id,
                    layout
                );
                const trees = updateTrees(prev, treeWithLayout);

                traverseTree(
                    nodeWithLayout,
                    parentId,
                    parentTreeId,
                    hierarchy,
                    treeIndex,
                    layouts,
                    true
                );

                return {
                    ...prev,
                    trees,
                    layouts,
                    hierarchy,
                    treeIndex,
                    metadata: updateMetadata(prev.metadata),
                };
            });

            return child.block.id;
        },
        []
    );

    /**
     * Add either a top-level block tree (when `parentId` is null)
     * or a nested block inside an existing parent.
     */
    const addBlock = useCallback(
        (
            block: BlockNode,
            parentId: string | null = null,
            slotName: string = "main",
            index: number | null = null
        ): string => {
            if (parentId) {
                return insertBlock(block, parentId, slotName, index);
            }

            const id = block.block.id;
            setEnvironment((prev) => {
                if (prev.treeIndex.has(id)) {
                    console.warn(`Block ${id} already exists in environment`);
                    return prev;
                }

                const layout = normaliseLayout(block.block.layout ?? getCurrentDimensions(block));
                const rootNode: BlockNode = {
                    ...block,
                    block: {
                        ...block.block,
                        layout,
                    },
                };

                const tree: BlockTree = {
                    type: "block_tree",
                    root: rootNode,
                };

                const trees = insertTree(prev, tree, index);
                const layouts = new Map(prev.layouts);
                const hierarchy = new Map(prev.hierarchy);
                const treeIndex = new Map(prev.treeIndex);

                layouts.set(id, layout);
                hierarchy.set(id, null);
                treeIndex.set(id, id);

                if (isContentNode(rootNode) && rootNode.children) {
                    Object.values(rootNode.children).forEach((slotChildren) => {
                        slotChildren.forEach((child) => {
                            traverseTree(child, id, id, hierarchy, treeIndex, layouts);
                        });
                    });
                }

                return {
                    ...prev,
                    trees,
                    layouts,
                    hierarchy,
                    treeIndex,
                    metadata: updateMetadata(prev.metadata),
                };
            });

            return id;
        },
        [insertBlock]
    );

    /** Remove a block tree (top-level) or a nested block from its parent. */
    const removeBlock = useCallback((blockId: string): void => {
        setEnvironment((prev) => {
            // Find the owning tree
            const treeId = prev.treeIndex.get(blockId);
            if (!treeId) {
                return prev;
            }

            // If removing a top-level tree, drop the whole instance
            if (blockId === treeId) return removeTree(prev, treeId);

            // Otherwise, detach from parent node
            return removeChild(prev, blockId);
        });
    }, []);

    const removeTree = (environment: EditorEnvironment, treeId: string): EditorEnvironment => {
        const trees = environment.trees.filter((instance) => getTreeId(instance) !== treeId);
        // Find all current children that belong to this tree
        const children = Array.from(environment.treeIndex.entries())
            .filter(([, tId]) => tId === treeId)
            .map(([id]) => id);

        // Drop all children from the various maps
        const layouts = new Map(environment.layouts);
        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        children.forEach((childId) => {
            layouts.delete(childId);
            hierarchy.delete(childId);
            treeIndex.delete(childId);
        });

        return {
            ...environment,
            trees,
            layouts,
            hierarchy,
            treeIndex,
            metadata: updateMetadata(environment.metadata),
        };
    };
    const removeChild = (environment: EditorEnvironment, childId: string): EditorEnvironment => {
        const treeId = environment.treeIndex.get(childId);
        if (!treeId) {
            return environment;
        }

        const tree = findTree(environment, treeId);
        if (!tree) {
            return environment;
        }

        // Attempt to detach the child node
        const detach = detachNode(tree, childId);
        if (!detach) return environment;

        const { updatedTree, detachedNode } = detach;
        if (!updatedTree) {
            return environment;
        }

        // Update the owning tree instance
        const trees = updateTrees(environment, updatedTree);

        // Find all current children that belong to the detached node and remove from environmnent maps
        const children = new Set<string>();
        collectDescendantIds(detachedNode!, children);
        children.add(childId);

        // Drop all children from the various maps
        const layouts = new Map(environment.layouts);
        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        children.forEach((id) => {
            layouts.delete(id);
            hierarchy.delete(id);
            treeIndex.delete(id);
        });

        return {
            ...environment,
            trees,
            layouts,
            hierarchy,
            treeIndex,
            metadata: updateMetadata(environment.metadata),
        };
    };

    /** Replace the contents of an existing block. */
    const updateBlock = useCallback((blockId: string, updatedContent: BlockNode): void => {
        setEnvironment((prev) => {
            const treeId = prev.treeIndex.get(blockId);
            if (!treeId) {
                return prev;
            }

            const tree = findTree(prev, treeId);
            if (!tree) {
                return prev;
            }

            const normalisedNode =
                updatedContent.block.layout != null
                    ? {
                          ...updatedContent,
                          block: {
                              ...updatedContent.block,
                              layout: normaliseLayout(updatedContent.block.layout),
                          },
                      }
                    : updatedContent;

            const updatedTree = replaceNode(tree, normalisedNode);
            const trees = updateTrees(prev, updatedTree);

            const layouts = new Map(prev.layouts);
            if (normalisedNode.block.layout) {
                layouts.set(blockId, normalisedNode.block.layout);
            }

            return {
                ...prev,
                trees,
                layouts,
                metadata: updateMetadata(prev.metadata),
            };
        });
    }, []);

    /** Persist a new layout rectangle for the given block id. */
    const updateLayout = useCallback((blockId: string, layout: GridRect): void => {
        const nextLayout = normaliseLayout(layout);

        setEnvironment((prev) => {
            const layouts = new Map(prev.layouts);
            layouts.set(blockId, nextLayout);

            const treeId = prev.treeIndex.get(blockId);
            let trees = prev.trees;

            if (treeId) {
                const tree = findTree(prev, treeId);
                if (tree) {
                    const updatedTree = persistLayoutOnTree(tree, blockId, nextLayout);
                    trees = updateTrees(prev, updatedTree);
                }
            }

            return {
                ...prev,
                trees,
                layouts,
                metadata: updateMetadata(prev.metadata),
            };
        });
    }, []);

    const getTrees = useCallback((): BlockTree[] => {
        return environment.trees;
    }, [environment.trees]);

    /** Retrieve a block instance by its ID, or undefined if not found. */
    const getBlock = useCallback(
        (blockId: string): BlockNode | undefined => {
            const parent = environment.treeIndex.get(blockId);
            if (!parent) {
                return undefined;
            }

            // Performn DFS on parent tree to find block
            const tree = findTree(environment, parent);
            if (!tree) return;
            return findNodeById(tree.root, blockId);
        },
        [environment]
    );

    /**
     * Core move operation handling promotions, demotions, and cross-tree moves.
     */
    const moveBlock = useCallback(
        (
            blockId: string,
            targetParentId: string | null,
            targetSlot: string = "main",
            layoutOverride?: GridRect
        ) => {
            console.log("hey");
            setEnvironment((prev) => {
                const treeId = prev.treeIndex.get(blockId);
                if (!treeId) {
                    return prev;
                }

                const layouts = new Map(environment.layouts);
                const hierarchy = new Map(environment.hierarchy);
                const treeIndex = new Map(environment.treeIndex);

                const currentParent = prev.hierarchy.get(blockId) ?? null;
                const normalisedOverride = layoutOverride
                    ? normaliseLayout(layoutOverride)
                    : undefined;

                if (targetParentId === currentParent) {
                    if (!normalisedOverride) {
                        return prev;
                    }

                    const layouts = new Map(prev.layouts);
                    layouts.set(blockId, normalisedOverride);

                    const tree = findTree(prev, treeId);
                    let trees = prev.trees;
                    if (tree) {
                        const updatedTree = persistLayoutOnTree(tree, blockId, normalisedOverride);
                        trees = updateTrees(prev, updatedTree);
                    }

                    return {
                        ...prev,
                        trees,
                        layouts,
                        metadata: updateMetadata(prev.metadata),
                    };
                }

                if (targetParentId === null) {
                    return moveBlockToTopLevel(prev, blockId, treeId, normalisedOverride);
                }

                const targetTreeId = treeIndex.get(targetParentId);
                if (!targetTreeId) {
                    return prev;
                }

                const sourceTree = findTree(prev, treeId);
                const targetTree = findTree(prev, targetTreeId);
                if (!sourceTree || !targetTree) {
                    return prev;
                }

                const detachResult = detachNode(sourceTree, blockId);
                if (!detachResult) {
                    return prev;
                }

                const { updatedTree: updatedSourceTree, detachedNode } = detachResult;

                const fallbackLayout = calculateNextLayout(
                    detachedNode,
                    layouts,
                    hierarchy,
                    targetParentId
                );
                const layout = normalisedOverride
                    ? normaliseLayout({
                          ...fallbackLayout,
                          ...normalisedOverride,
                          width: normalisedOverride.width ?? fallbackLayout.width,
                          height: normalisedOverride.height ?? fallbackLayout.height,
                      })
                    : normaliseLayout(fallbackLayout);

                const nodeWithLayout: BlockNode = {
                    ...detachedNode,
                    block: {
                        ...detachedNode.block,
                        layout,
                    },
                };

                let trees: BlockTree[];
                if (targetTreeId === treeId) {
                    const treeWithInsertion = insertNode(
                        updatedSourceTree,
                        targetParentId,
                        targetSlot,
                        nodeWithLayout
                    );
                    const finalTree = persistLayoutOnTree(treeWithInsertion, blockId, layout);
                    trees = updateTrees(prev, finalTree);
                } else {
                    const treeWithInsertion = insertNode(
                        targetTree,
                        targetParentId,
                        targetSlot,
                        nodeWithLayout
                    );
                    const finalTarget = persistLayoutOnTree(treeWithInsertion, blockId, layout);
                    trees = updateManyTrees(prev, [updatedSourceTree, finalTarget]);
                }

                layouts.set(blockId, layout);

                traverseTree(
                    nodeWithLayout,
                    targetParentId,
                    targetTreeId,
                    hierarchy,
                    treeIndex,
                    layouts,
                    true
                );

                return {
                    ...prev,
                    trees,
                    layouts,
                    hierarchy,
                    treeIndex,
                    metadata: updateMetadata(prev.metadata),
                };
            });
        },
        []
    );

    const moveBlockToTopLevel = (
        environment: EditorEnvironment,
        blockId: string,
        currentTreeId: string,
        layoutOverride?: GridRect
    ): EditorEnvironment => {
        const tree = findTree(environment, currentTreeId);
        if (!tree) return environment;

        const detachResult = detachNode(tree, blockId);
        if (!detachResult) return environment;

        const { updatedTree, detachedNode } = detachResult;

        const layouts = new Map(environment.layouts);
        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        const fallbackLayout = calculateNextLayout(detachedNode, layouts, hierarchy, null);
        const layout = layoutOverride
            ? normaliseLayout({
                  ...fallbackLayout,
                  ...layoutOverride,
                  width: layoutOverride.width ?? fallbackLayout.width,
                  height: layoutOverride.height ?? fallbackLayout.height,
              })
            : normaliseLayout(fallbackLayout);

        const nodeWithLayout: BlockNode = {
            ...detachedNode,
            block: {
                ...detachedNode.block,
                layout,
            },
        };

        const newTree: BlockTree = {
            type: "block_tree",
            root: nodeWithLayout,
        };

        const trees = [...updateTrees(environment, updatedTree), newTree];

        layouts.set(blockId, layout);
        hierarchy.set(blockId, null);
        treeIndex.set(blockId, blockId);

        if (isContentNode(nodeWithLayout) && nodeWithLayout.children) {
            Object.values(nodeWithLayout.children).forEach((slotChildren) => {
                slotChildren.forEach((child) => {
                    traverseTree(child, blockId, blockId, hierarchy, treeIndex, layouts);
                });
            });
        }

        return {
            ...environment,
            trees,
            layouts,
            hierarchy,
            treeIndex,
            metadata: updateMetadata(environment.metadata),
        };
    };

    /** Return the parent block id for the supplied block. */
    const getParent = useCallback(
        (blockId: string): string | null => {
            return environment.hierarchy.get(blockId) ?? null;
        },
        [environment.hierarchy]
    );

    /** Enumerate the children of a block (ignoring slot grouping for now). */
    const getChildren = useCallback(
        (blockId: string, _slotName?: string): string[] => {
            void _slotName;
            return Array.from(environment.hierarchy.entries())
                .filter(([, parent]) => parent === blockId)
                .map(([id]) => id);
        },
        [environment.hierarchy]
    );

    /** Collect all descendant ids beneath a block. */
    const getDescendants = useCallback(
        (blockId: string): string[] => {
            const descendants: string[] = [];
            const queue: string[] = [blockId];

            while (queue.length > 0) {
                const current = queue.shift()!;
                const children = Array.from(environment.hierarchy.entries())
                    .filter(([, parent]) => parent === current)
                    .map(([id]) => id);
                descendants.push(...children);
                queue.push(...children);
            }

            return descendants;
        },
        [environment.hierarchy]
    );

    /** Check whether `blockId` lies underneath `ancestorId`. */
    const isDescendantOf = useCallback(
        (blockId: string, ancestorId: string): boolean => {
            let current: string | null = environment.hierarchy.get(blockId) ?? null;
            while (current) {
                if (current === ancestorId) {
                    return true;
                }
                current = environment.hierarchy.get(current) ?? null;
            }
            return false;
        },
        [environment.hierarchy]
    );

    /** Manually adjust the hierarchy map (used by grid-sync logic). */
    const updateHierarchy = useCallback((blockId: string, newParentId: string | null) => {
        setEnvironment((prev) => {
            const hierarchy = new Map(prev.hierarchy);
            hierarchy.set(blockId, newParentId);
            return { ...prev, hierarchy };
        });
    }, []);

    /** Reset the environment back to an empty canvas. */
    const clear = useCallback((): void => {
        setEnvironment(createEmptyEnvironment(organisationId));
    }, [organisationId]);

    const value = useMemo<BlockEnvironmentContextValue>(
        () => ({
            environment,
            addBlock,
            insertBlock,
            removeBlock,
            updateBlock,
            updateLayout,
            getTrees,
            getBlock,
            moveBlock,
            getParent,
            getChildren,
            getDescendants,
            isDescendantOf,
            updateHierarchy,
            clear,
        }),
        [
            environment,
            addBlock,
            insertBlock,
            removeBlock,
            updateBlock,
            updateLayout,
            getTrees,
            getBlock,
            moveBlock,
            getParent,
            getChildren,
            getDescendants,
            isDescendantOf,
            updateHierarchy,
            clear,
        ]
    );

    return (
        <BlockEnvironmentContext.Provider value={value}>
            {children}
        </BlockEnvironmentContext.Provider>
    );
};

/** Hook wrapper for the context. */
export const useBlockEnvironment = (): BlockEnvironmentContextValue => {
    const context = useContext(BlockEnvironmentContext);
    if (!context) {
        throw new Error("useBlockEnvironment must be used within BlockEnvironmentProvider");
    }
    return context;
};
