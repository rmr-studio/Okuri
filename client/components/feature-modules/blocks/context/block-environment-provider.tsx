"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { BlockNode, BlockTree, GridRect, isContentNode } from "../interface/block.interface";
import {
    BlockEnvironmentContextValue,
    BlockEnvironmentProviderProps,
    EditorEnvironment,
} from "../interface/editor.interface";
import { init } from "../util/environment/environment.util";

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
    const addBlock = useCallback((tree: BlockNode, parentId: string | null = null): string => {
        if (parentId) {
            return insertNestedBlockInternal(tree, parentId, "main", layout, setEnvironment);
        }

        const rootId = tree.root.block.id;

        setEnvironment((prev) => {
            if (prev.treeIndex.has(rootId)) {
                console.warn(`Block ${rootId} already exists in environment`);
                return prev;
            }

            const treeInstance: EditorTreeInstance = {
                id: rootId,
                tree: cloneBlockTree(tree),
                layout,
            };

            const trees = [...prev.trees, treeInstance];
            const layouts = new Map(prev.layouts);
            const hierarchy = new Map(prev.hierarchy);
            const treeIndex = new Map(prev.treeIndex);

            const layoutForRoot = layout ?? calculateNextLayout(layouts, hierarchy, null);
            layouts.set(rootId, layoutForRoot);
            hierarchy.set(rootId, null);
            treeIndex.set(rootId, rootId);

            const rootNode = treeInstance.tree.root;
            if (isContentNode(rootNode) && rootNode.children) {
                Object.values(rootNode.children).forEach((slotChildren) => {
                    slotChildren.forEach((child) => {
                        traverseTree(
                            child,
                            rootId,
                            rootId,
                            hierarchy,
                            treeIndex,
                            layouts,
                            uiMetadata
                        );
                    });
                });
            }

            return {
                ...prev,
                trees,
                layouts,
                hierarchy,
                treeIndex,
                uiMetadata,
                metadata: updateMetadata(prev.metadata),
            };
        });

        return rootId;
    }, []);

    function calculateNextLayout(
        layouts: Map<string, EditorLayoutRect>,
        hierarchy: Map<string, string | null>,
        parentId: string | null
    ): GridRect {
        const siblingIds = Array.from(hierarchy.entries())
            .filter(([, parent]) => parent === parentId)
            .map(([id]) => id);

        let maxY = 0;
        siblingIds.forEach((id) => {
            const layout = layouts.get(id);
            if (!layout) {
                return;
            }
            const bottom = layout.y + layout.h;
            if (bottom > maxY) {
                maxY = bottom;
            }
        });

        return {
            x: 0,
            y: maxY > 0 ? maxY + 1 : 0,
            w: 12,
            h: 8,
        };
    }

    /** Remove a block tree (top-level) or a nested block from its parent. */
    const removeBlock = useCallback((blockId: string): void => {
        setEnvironment((prev) => {
            // Find the owning tree
            const treeId = prev.treeIndex.get(blockId);
            if (!treeId) {
                return prev;
            }

            // If removing a top-level tree, drop the whole instance
            if (blockId === treeId) {
                const trees = prev.trees.filter((instance) => instance.id !== blockId);
                // Drop the entire tree and all of its descendants.
                const idsToRemove = collectTreeBlockIds(
                    prev.trees.find((instance) => instance.id === blockId)!.tree
                );
                idsToRemove.forEach((id) => {
                    layouts.delete(id);
                    hierarchy.delete(id);
                    uiMetadata.delete(id);
                    treeIndex.delete(id);
                });
            } else {
                const treeInstance = prev.trees.find((instance) => instance.id === treeId);
                if (!treeInstance) {
                    return prev;
                }

                const detachResult = detachNode(treeInstance.tree, blockId);
                if (!detachResult) {
                    return prev;
                }

                trees = trees.map((instance) =>
                    instance.id === treeId
                        ? { ...instance, tree: detachResult.updatedTree }
                        : instance
                );

                const idsToRemove = new Set<string>([blockId]);
                collectDescendantIds(detachResult.detachedNode, idsToRemove);
                idsToRemove.forEach((id) => {
                    layouts.delete(id);
                    hierarchy.delete(id);
                    uiMetadata.delete(id);
                    treeIndex.delete(id);
                });
            }

            return {
                ...prev,
                trees,
                layouts,
                hierarchy,
                treeIndex,
                uiMetadata,
                metadata: updateMetadata(prev.metadata),
            };
        });
    }, []);

    /** Replace the contents of an existing block. */
    const updateBlock = useCallback((blockId: string, tree: BlockTree): void => {
        setEnvironment((prev) => {
            const treeId = prev.treeIndex.get(blockId);
            if (!treeId) {
                return prev;
            }

            const trees = prev.trees.map((instance) => {
                if (instance.id !== treeId) {
                    return instance;
                }

                if (instance.id === blockId) {
                    return { ...instance, tree: cloneBlockTree(tree) };
                }

                const replacement = cloneBlockNode(tree.root);
                return { ...instance, tree: replaceNode(instance.tree, blockId, replacement) };
            });

            return { ...prev, trees, metadata: updateMetadata(prev.metadata) };
        });
    }, []);

    /** Persist a new layout rectangle for the given block id. */
    const updateLayout = useCallback((blockId: string, layout: EditorLayoutRect): void => {
        setEnvironment((prev) => {
            const layouts = new Map(prev.layouts);
            layouts.set(blockId, layout);
            return { ...prev, layouts };
        });
    }, []);

    /** Materialise a dedicated block tree for the requested block id. */
    const getBlock = useCallback(
        (blockId: string): EditorBlockInstance | undefined => {
            return materialiseBlockInstance(environment, blockId);
        },
        [environment]
    );

    /** Return every block instance currently tracked by the environment. */
    const getAllBlocks = useCallback((): EditorBlockInstance[] => {
        return Array.from(environment.hierarchy.keys())
            .map((id) => materialiseBlockInstance(environment, id))
            .filter((instance): instance is EditorBlockInstance => Boolean(instance));
    }, [environment]);

    /** Insert a nested block under the specified parent/slot. */
    const insertNestedBlock = useCallback(
        (
            parentId: string,
            slotName: string,
            childTree: BlockTree,
            layout?: EditorLayoutRect
        ): string => {
            return insertNestedBlockInternal(childTree, parentId, slotName, layout, setEnvironment);
        },
        []
    );

    /**
     * Core move operation handling promotions, demotions, and cross-tree moves.
     */
    const moveBlock = useCallback(
        (
            blockId: string,
            targetParentId: string | null,
            targetSlot: string = "main",
            layout?: EditorLayoutRect
        ) => {
            setEnvironment((prev) => {
                const treeId = prev.treeIndex.get(blockId);
                if (!treeId) {
                    return prev;
                }

                const currentParent = prev.hierarchy.get(blockId) ?? null;

                // Nothing changed - optionally persist the new layout.
                if (targetParentId === currentParent) {
                    if (layout) {
                        const layouts = new Map(prev.layouts);
                        layouts.set(blockId, layout);
                        return { ...prev, layouts };
                    }
                    return prev;
                }

                const layouts = new Map(prev.layouts);
                const hierarchy = new Map(prev.hierarchy);
                const treeIndex = new Map(prev.treeIndex);
                const uiMetadata = new Map(prev.uiMetadata);
                let trees = [...prev.trees];

                if (targetParentId === null) {
                    const treeInstance = prev.trees.find((instance) => instance.id === treeId);
                    if (!treeInstance) {
                        return prev;
                    }

                    const detachResult = detachNode(treeInstance.tree, blockId);
                    if (!detachResult) {
                        return prev;
                    }

                    const promotedTree: EditorTreeInstance = {
                        id: blockId,
                        tree: buildTreeFromNode(detachResult.detachedNode, treeInstance.tree),
                    };

                    trees = trees
                        .map((instance) =>
                            instance.id === treeId
                                ? { ...instance, tree: detachResult.updatedTree }
                                : instance
                        )
                        .concat(promotedTree);

                    const layoutForRoot = layout ?? calculateNextLayout(layouts, hierarchy, null);
                    layouts.set(blockId, layoutForRoot);
                    hierarchy.set(blockId, null);
                    treeIndex.set(blockId, blockId);
                    uiMetadata.set(blockId, uiMetadata.get(blockId) ?? {});

                    const promotedNode = promotedTree.tree.root;
                    if (isContentNode(promotedNode) && promotedNode.children) {
                        Object.values(promotedNode.children).forEach((slotChildren) => {
                            slotChildren.forEach((child) => {
                                traverseTree(
                                    child,
                                    blockId,
                                    blockId,
                                    hierarchy,
                                    treeIndex,
                                    layouts,
                                    uiMetadata
                                );
                            });
                        });
                    }

                    return {
                        ...prev,
                        trees,
                        layouts,
                        hierarchy,
                        treeIndex,
                        uiMetadata,
                        metadata: updateMetadata(prev.metadata),
                    };
                }

                const targetTreeId = treeIndex.get(targetParentId);
                if (!targetTreeId) {
                    return prev;
                }

                const sourceTreeInstance = prev.trees.find((instance) => instance.id === treeId);
                const targetTreeInstance = prev.trees.find(
                    (instance) => instance.id === targetTreeId
                );
                if (!sourceTreeInstance || !targetTreeInstance) {
                    return prev;
                }

                const detachResult = detachNode(sourceTreeInstance.tree, blockId);
                if (!detachResult) {
                    return prev;
                }

                const updatedSourceTree = detachResult.updatedTree;
                const updatedTargetTree = insertNode(
                    targetTreeId === treeId ? updatedSourceTree : targetTreeInstance.tree,
                    targetParentId,
                    targetSlot,
                    detachResult.detachedNode
                );

                trees = prev.trees.map((instance) => {
                    if (instance.id === treeId && treeId === targetTreeId) {
                        return { ...instance, tree: updatedTargetTree };
                    }
                    if (instance.id === treeId) {
                        return { ...instance, tree: updatedSourceTree };
                    }
                    if (instance.id === targetTreeId) {
                        return { ...instance, tree: updatedTargetTree };
                    }
                    return instance;
                });

                const nextLayout =
                    layout ?? calculateNextLayout(layouts, hierarchy, targetParentId);
                layouts.set(blockId, nextLayout);
                hierarchy.set(blockId, targetParentId);

                const reindexedIds = new Set<string>([blockId]);
                collectDescendantIds(detachResult.detachedNode, reindexedIds);
                reindexedIds.forEach((id) => treeIndex.set(id, targetTreeId));

                return {
                    ...prev,
                    trees,
                    layouts,
                    hierarchy,
                    treeIndex,
                    uiMetadata,
                    metadata: updateMetadata(prev.metadata),
                };
            });
        },
        []
    );

    /** Promote a nested block to the top level by delegating to `moveBlock`. */
    const promoteToTopLevel = useCallback(
        (blockId: string, layout?: EditorLayoutRect): void => {
            moveBlock(blockId, null, "main", layout);
        },
        [moveBlock]
    );

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

    /** Merge UI metadata for a particular block. */
    const updateUIMetadata = useCallback(
        (blockId: string, metadata: Partial<EditorBlockUIMetadata>) => {
            setEnvironment((prev) => {
                const uiMetadata = new Map(prev.uiMetadata);
                uiMetadata.set(blockId, {
                    ...(uiMetadata.get(blockId) ?? {}),
                    ...metadata,
                });
                return { ...prev, uiMetadata };
            });
        },
        []
    );

    /** Reset the environment back to an empty canvas. */
    const clear = useCallback((): void => {
        setEnvironment(createEmptyEnvironment(organisationId));
    }, [organisationId]);

    const value = useMemo<BlockEnvironmentContextValue>(
        () => ({
            environment,
            addBlock,
            removeBlock,
            updateBlock,
            updateLayout,
            getBlock,
            insertNestedBlock,
            promoteToTopLevel,
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
            removeBlock,
            updateBlock,
            updateLayout,
            getBlock,
            getAllBlocks,
            getTopLevelBlocks,
            insertNestedBlock,
            promoteToTopLevel,
            moveBlock,
            getParent,
            getChildren,
            getDescendants,
            isDescendantOf,
            updateHierarchy,
            updateUIMetadata,
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

/* -------------------------------------------------------------------------- */
/*                        Internal Mutation Convenience                        */
/* -------------------------------------------------------------------------- */

function insertNestedBlockInternal(
    childTree: BlockTree,
    parentId: string,
    slotName: string,
    layout: EditorLayoutRect | undefined,
    setEnvironment: React.Dispatch<React.SetStateAction<EditorEnvironment>>
): string {
    setEnvironment((prev) => {
        const parentTreeId = prev.treeIndex.get(parentId);
        if (!parentTreeId) {
            console.warn(`Parent block ${parentId} not found`);
            return prev;
        }

        const trees = prev.trees.map((instance) =>
            instance.id === parentTreeId
                ? { ...instance, tree: insertNode(instance.tree, parentId, slotName, childNode) }
                : instance
        );

        const layouts = new Map(prev.layouts);
        const hierarchy = new Map(prev.hierarchy);
        const treeIndex = new Map(prev.treeIndex);
        const uiMetadata = new Map(prev.uiMetadata);

        const childLayout = layout ?? calculateNextLayout(layouts, hierarchy, parentId);
        layouts.set(childId, childLayout);

        traverseTree(
            childNode,
            parentId,
            parentTreeId,
            hierarchy,
            treeIndex,
            layouts,
            uiMetadata,
            true
        );

        return {
            ...prev,
            trees,
            layouts,
            hierarchy,
            treeIndex,
            uiMetadata,
            metadata: updateMetadata(prev.metadata),
        };
    });

    return childId;
}
