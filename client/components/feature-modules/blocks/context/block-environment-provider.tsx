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
    replaceNode,
    traverseTree,
    updateManyTrees,
    updateMetadata,
    updateTrees,
} from "../util/environment/environment.util";

//todo. Maybe migrate to Zustand.

const BlockEnvironmentContext = createContext<BlockEnvironmentContextValue | null>(null);

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
     * Add either a top-level block tree (when `parentId` is null)
     * or a nested block inside an existing parent.
     */
    const addBlock = useCallback((block: BlockNode, parentId: string | null = null): string => {
        // If Parent ID is specified. Insert block as child inside existing node
        if (parentId) {
            // TODO Handle new slot names (Maybe default inside "blockTree??")
            return insertBlock(block, parentId, "main");
        }

        // Otherwise, add as new top-level tree
        const id = block.block.id;
        setEnvironment((prev) => {
            // Prevent duplicate top-level trees
            if (prev.treeIndex.has(id)) {
                console.warn(`Block ${id} already exists in environment`);
                return prev;
            }

            const tree: BlockTree = {
                type: "block_tree",
                root: block,
            };

            const trees = [...prev.trees, tree];
            const layouts = new Map(prev.layouts);
            const hierarchy = new Map(prev.hierarchy);
            const treeIndex = new Map(prev.treeIndex);
            const layout = getCurrentDimensions(block);

            layouts.set(id, layout);
            hierarchy.set(id, null);
            treeIndex.set(id, id);

            // If we have children, traverse them to index properly and ensure they reference the appropriate parents
            if (isContentNode(block) && block.children) {
                Object.values(block.children).forEach((slotChildren) => {
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
    }, []);

    /**
     * Inserts a block under the specified parent/slot, updating all relevant environment maps.
     * @param child The block to insert.
     * @param parentId The ID of the parent block.
     * @param slotName The name of the slot to insert into.
     * @returns The ID of the inserted block.
     */
    const insertBlock = (child: BlockNode, parentId: string, slotName: string): string => {
        setEnvironment((prev) => {
            const parentTreeId = prev.treeIndex.get(parentId);
            if (!parentTreeId) {
                console.warn(`Parent block ${parentId} not found`);
                return prev;
            }

            // Update tree layout to accommodate new child
            const trees = prev.trees.map((instance) => {
                if (getTreeId(instance) !== parentTreeId) return instance;
                const updatedTree = insertNode(instance, parentId, slotName, child);
                return { ...instance, tree: updatedTree };
            });

            const layouts = new Map(prev.layouts);
            const hierarchy = new Map(prev.hierarchy);
            const treeIndex = new Map(prev.treeIndex);
            const childLayout = calculateNextLayout(child, layouts, hierarchy, parentId);
            layouts.set(child.block.id, childLayout);

            // Traverse the inserted tree and rehydrate environmental maps to ensure all further descendants have their associated relationships established
            // Skip layout adjustment during traversal as we've already calculated the initial layout for the root above
            traverseTree(child, parentId, parentTreeId, hierarchy, treeIndex, layouts, true);

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
    };

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
        const children = environment.treeIndex
            .entries()
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

            const updatedTree = replaceNode(tree, updatedContent);
            const trees = updateTrees(prev, updatedTree);

            return {
                ...prev,
                trees,
                metadata: updateMetadata(prev.metadata),
            };
        });
    }, []);

    /** Persist a new layout rectangle for the given block id. */
    const updateLayout = useCallback((blockId: string, layout: GridRect): void => {
        setEnvironment((prev) => {
            const layouts = new Map(prev.layouts);
            layouts.set(blockId, layout);
            return { ...prev, layouts };
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
        (blockId: string, targetParentId: string | null, targetSlot: string = "main") => {
            setEnvironment((prev) => {
                // Get current position of block in terms of arching tree
                const treeId = prev.treeIndex.get(blockId);
                if (!treeId) {
                    return prev;
                }

                // Get direct parent
                const currentParent = prev.hierarchy.get(blockId) ?? null;
                if (targetParentId === currentParent) return prev;

                // Move node to the top level, prepare new tree and insert into environment
                if (targetParentId === null) return moveBlockToTopLevel(prev, blockId, treeId);

                // Otherwise, move within or across existing trees
                const layouts = new Map(environment.layouts);
                const hierarchy = new Map(environment.hierarchy);
                const treeIndex = new Map(environment.treeIndex);

                const targetTreeId = treeIndex.get(targetParentId);
                if (!targetTreeId) {
                    return prev;
                }

                const sourceTree = findTree(prev, treeId);
                const targetTree = findTree(prev, targetTreeId);

                if (!sourceTree || !targetTree) return prev;

                const detachResult = detachNode(sourceTree, blockId);
                if (!detachResult) return prev;
                const { updatedTree: updatedSourceTree, detachedNode } = detachResult;

                const updatedTargetTree: BlockTree = insertNode(
                    targetTreeId === treeId ? updatedSourceTree : targetTree,
                    targetParentId,
                    targetSlot,
                    detachedNode
                );

                // Update trees array
                const trees = updateManyTrees(prev, [updatedSourceTree, updatedTargetTree]);

                // Update layout and hierarchy maps
                const nextLayout = calculateNextLayout(
                    detachedNode,
                    layouts,
                    hierarchy,
                    targetParentId
                );
                layouts.set(blockId, nextLayout);
                hierarchy.set(blockId, targetParentId);

                // Update all child nodes to reference the new tree
                const reindexedIds = new Set<string>([blockId]);
                collectDescendantIds(detachResult.detachedNode, reindexedIds);
                reindexedIds.forEach((id) => treeIndex.set(id, targetTreeId));

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
        currentTreeId: string
    ): EditorEnvironment => {
        const tree = findTree(environment, currentTreeId);
        if (!tree) return environment;
        // Attempt to detach from current tree
        const detachResult = detachNode(tree, blockId);
        if (!detachResult) return environment;

        const { updatedTree, detachedNode } = detachResult;
        const newTree: BlockTree = {
            type: "block_tree",
            root: detachedNode,
        };

        const layouts = new Map(environment.layouts);
        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        // Update the original tree instance
        const layout = calculateNextLayout(detachedNode, layouts, hierarchy, null);

        // TODO: Implement Environment Block Tree order indexing to allow precise control over new tree placement. For now we append to the end.
        const trees = [...updateTrees(environment, updatedTree), newTree];

        layouts.set(blockId, layout);
        hierarchy.set(blockId, null);
        treeIndex.set(blockId, blockId);

        // Traverse any children to re-index their relationships in the environment maps
        if (isContentNode(detachedNode) && detachedNode.children) {
            Object.values(detachedNode.children).forEach((slotChildren) => {
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
