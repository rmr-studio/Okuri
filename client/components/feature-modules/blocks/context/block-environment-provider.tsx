"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { BlockNode, BlockTree, isContentNode } from "../interface/block.interface";
import {
    BlockEnvironmentContextValue,
    BlockEnvironmentProviderProps,
    EditorEnvironment,
} from "../interface/editor.interface";
import {
    collectDescendantIds,
    cloneEnvironment,
    createEmptyEnvironment,
    detachNode,
    findNodeById,
    findTree,
    getTreeId,
    init,
    insertNode,
    insertTree,
    reorderNode,
    replaceNode,
    traverseTree,
    updateManyTrees,
    updateMetadata,
    updateTrees,
} from "../util/environment/environment.util";

//todo. Maybe migrate to Zustand.

export const BlockEnvironmentContext = createContext<BlockEnvironmentContextValue | null>(null);

/**
 * Provides state and helpers for the block environment editor.
 */
export const BlockEnvironmentProvider: React.FC<BlockEnvironmentProviderProps> = ({
    organisationId,
    initialTrees,
    blockTreeLayout,
    children,
}) => {
    const initialEnvironment = useMemo(
        () => init(organisationId, initialTrees),
        [organisationId, initialTrees]
    );

    const { environment: initialEnvState } = initialEnvironment;

    const [environment, setEnvironment] = useState<EditorEnvironment>(initialEnvState);
    const environmentRef = useRef(environment);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        environmentRef.current = environment;
    }, [environment]);

    // Derive layout from blockTreeLayout
    const layoutForGrid = blockTreeLayout?.layout;
    const layoutId = blockTreeLayout?.id;

    useEffect(() => {
        setEnvironment(initialEnvState);
    }, [initialEnvState]);

    /**
     * Inserts a block under the specified parent/slot, updating all relevant environment maps.
     * @param child The block to insert.
     * @param parentId The ID of the parent block.
     * @returns The ID of the inserted block.
     */
    const insertBlock = useCallback(
        (child: BlockNode, parentId: string, index: number | null = null): string => {
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

                const hierarchy = new Map(prev.hierarchy);
                const treeIndex = new Map(prev.treeIndex);

                const { success, payload: updatedNode } = insertNode(
                    parentTree.root,
                    parentId,
                    child,
                    index
                );

                if (!success) {
                    console.warn(
                        `Failed to insert block ${child.block.id} into parent ${parentId}`
                    );
                    return prev;
                }

                const updatedTree = {
                    ...parentTree,
                    root: updatedNode,
                };

                const trees = updateTrees(prev, updatedTree);

                traverseTree(child, parentId, parentTreeId, hierarchy, treeIndex);

                return {
                    ...prev,
                    trees,
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
        (block: BlockNode, parentId: string | null = null, index: number | null = null): string => {
            if (parentId) {
                return insertBlock(block, parentId, index);
            }

            const id = block.block.id;
            setEnvironment((prev) => {
                if (prev.treeIndex.has(id)) {
                    console.warn(`Block ${id} already exists in environment`);
                    return prev;
                }

                const tree: BlockTree = {
                    type: "block_tree",
                    root: block,
                };

                const trees = insertTree(prev, tree, index);
                const hierarchy = new Map(prev.hierarchy);
                const treeIndex = new Map(prev.treeIndex);

                hierarchy.set(id, null);
                treeIndex.set(id, id);

                // Traverse children to re-link hierarchy and treeIndex
                if (isContentNode(block) && block.children) {
                    block.children.forEach((child) => {
                        traverseTree(child, id, id, hierarchy, treeIndex);
                    });
                }

                return {
                    ...prev,
                    trees,
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
        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        children.forEach((childId) => {
            hierarchy.delete(childId);
            treeIndex.delete(childId);
        });

        return {
            ...environment,
            trees,
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
        const detach = detachNode(tree.root, childId);
        if (!detach) return environment;

        const { root: updatedRoot, detachedNode, success } = detach;
        if (!success || !detachedNode) {
            return environment;
        }

        const updatedTree = {
            ...tree,
            root: updatedRoot,
        };

        // Update the owning tree instance
        const trees = updateTrees(environment, updatedTree);

        // Find all current children that belong to the detached node and remove from environmnent maps
        const children = new Set<string>();
        collectDescendantIds(detachedNode!, children);
        children.add(childId);

        // Drop all children from the various maps

        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        children.forEach((id) => {
            hierarchy.delete(id);
            treeIndex.delete(id);
        });

        return {
            ...environment,
            trees,

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

            const updatedRootNode = replaceNode(tree.root, updatedContent);
            const updatedTree = {
                ...tree,
                root: updatedRootNode,
            };
            const trees = updateTrees(prev, updatedTree);

            return {
                ...prev,
                trees,
                metadata: updateMetadata(prev.metadata),
            };
        });
    }, []);

    const getTrees = useCallback((): BlockTree[] => {
        return environment.trees;
    }, [environment]);

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
    const moveBlock = useCallback((blockId: string, targetParentId: string | null) => {
        setEnvironment((prev) => {
            const treeId = prev.treeIndex.get(blockId);
            if (!treeId) {
                return prev;
            }

            // If no parent has been given. Promote to top-level
            if (targetParentId === null) {
                return moveBlockToTopLevel(prev, blockId, treeId);
            }

            const targetTreeId = prev.treeIndex.get(targetParentId);

            if (!targetTreeId) {
                return prev;
            }

            const sourceTree = findTree(prev, treeId);
            const targetTree = findTree(prev, targetTreeId);

            if (!sourceTree || !targetTree) {
                return prev;
            }
            const currentParent = prev.hierarchy.get(blockId) ?? null;

            // This node is the root of a tree. Demote entire tree and move into a new parent as a child node.
            if (currentParent == null) {
                return moveTreeToNewParent(prev, sourceTree, targetTree, targetParentId);
            }
            return moveChildBlock(prev, sourceTree, targetTree, blockId, targetParentId);
        });
    }, []);

    //TODO: Move block with accordance to updated rendering index position

    /**
     * Detaches a child node from an existing parent and moves it to a new tree, updating both trees and re-indexing maps.
     */
    const moveChildBlock = (
        environment: EditorEnvironment,
        sourceTree: BlockTree,
        newTree: BlockTree,
        blockId: string,
        targetParentId: string
    ): EditorEnvironment => {
        // Detach node from source tree, given that it is a child node.
        const detachResult = detachNode(sourceTree.root, blockId);

        const { root: updatedSourceRoot, detachedNode, success } = detachResult;

        if (!success || !detachedNode) {
            return environment;
        }

        const updatedSourceTree = { ...sourceTree, root: updatedSourceRoot };

        // If moving within the same tree, insert into the updated tree (after detach)
        // Otherwise, insert into the target tree
        const treeToInsertInto = sourceTree === newTree ? updatedSourceTree : newTree;
        const { success: insertSuccess, payload: updatedRoot } = insertNode(
            treeToInsertInto.root,
            targetParentId,
            detachedNode
        );

        // If the insertion method rejects an insertion. It should return the same reference to the tree.
        if (!insertSuccess) {
            // Insertion failed, return original environment
            console.warn("Insertion failed, returning original environment");
            return environment;
        }

        const updatedTree = { ...treeToInsertInto, root: updatedRoot };

        // If same tree, only update once; otherwise update both
        const trees =
            sourceTree === newTree
                ? updateTrees(environment, updatedTree)
                : updateManyTrees(environment, [updatedSourceTree, updatedTree]);

        // Update maps accordingly

        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        // Update hierarchy and treeIndex for the moved node and its descendants
        traverseTree(detachedNode!, targetParentId, getTreeId(updatedTree), hierarchy, treeIndex);

        return {
            ...environment,
            trees,
            hierarchy,
            treeIndex,
            metadata: updateMetadata(environment.metadata),
        };
    };
    /**
     * Moves an entire tree to become a child of another block, removing that tree from the top-level list, and updating all relevant maps.
     */

    //TODO: Move block with accordance to updated rendering index position

    const moveTreeToNewParent = (
        environment: EditorEnvironment,
        sourceTree: BlockTree,
        newTree: BlockTree,
        targetParentId: string
    ): EditorEnvironment => {
        // There is no need to detach, just insert the root node into the new tree
        const { success: insertSuccess, payload: updatedRootNode } = insertNode(
            newTree.root,
            targetParentId,
            sourceTree.root
        );

        if (!insertSuccess) {
            return environment;
        }

        const updatedTree = { ...newTree, root: updatedRootNode };
        // Remove the source tree from the top-level list
        const trees = environment.trees.filter(
            (instance) => getTreeId(instance) !== getTreeId(sourceTree)
        );
        const updatedEnvironment = updateManyTrees({ ...environment, trees }, [updatedTree]);

        // Update maps accordingly
        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        // Update hierarchy and treeIndex for the moved node and its descendants
        traverseTree(sourceTree.root, targetParentId, getTreeId(updatedTree), hierarchy, treeIndex);

        return {
            ...environment,
            trees: updatedEnvironment,
            hierarchy,
            treeIndex,
            metadata: updateMetadata(environment.metadata),
        };
    };

    const moveBlockToTopLevel = (
        environment: EditorEnvironment,
        blockId: string,
        currentTreeId: string
    ): EditorEnvironment => {
        const tree = findTree(environment, currentTreeId);
        if (!tree) return environment;

        const detachResult = detachNode(tree.root, blockId);
        if (!detachResult) return environment;

        const { root: updatedRoot, success, detachedNode } = detachResult;
        if (!success || !detachedNode) {
            return environment;
        }

        const hierarchy = new Map(environment.hierarchy);
        const treeIndex = new Map(environment.treeIndex);

        const newTree: BlockTree = {
            type: "block_tree",
            root: detachedNode!,
        };

        const updatedTree = { ...tree, root: updatedRoot };

        const trees = [...updateTrees(environment, updatedTree), newTree];

        hierarchy.set(blockId, null);
        treeIndex.set(blockId, blockId);

        if (isContentNode(detachedNode!) && detachedNode!.children) {
            detachedNode.children.forEach((child) => {
                traverseTree(child, blockId, blockId, hierarchy, treeIndex);
            });
        }

        return {
            ...environment,
            trees,
            hierarchy,
            treeIndex,
            metadata: updateMetadata(environment.metadata),
        };
    };

    /** Return the parent block id for the supplied block. */
    const getParentId = useCallback(
        (blockId: string): string | null => {
            return environment.hierarchy.get(blockId) ?? null;
        },
        [environment]
    );

    const getParent = useCallback(
        (blockId: string): BlockNode | null => {
            const parentId = getParentId(blockId);
            if (!parentId) return null;

            const node = getBlock(parentId);
            if (!node) return null;

            // Avoid populating children to prevent deep nesting and overtly large structures
            return {
                ...node,
                children: undefined,
            };
        },
        [getParentId, getBlock]
    );

    /** Enumerate the children of a block (ignoring slot grouping for now). */
    const getChildren = useCallback(
        (blockId: string, _slotName?: string): string[] => {
            void _slotName;

            // Get the block node from the tree to preserve child order
            const block = getBlock(blockId);

            if (!block || !isContentNode(block) || !block.children) {
                return [];
            }

            // Return children IDs in the order they appear in the tree
            return block.children.map((child) => child.block.id);
        },
        [getBlock]
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
        [environment]
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
        [environment]
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

    /** Move a block up in its parent's children array (for lists) */
    const moveBlockUp = useCallback((blockId: string) => {}, []);

    /** Move a block down in its parent's children array (for lists) */
    const moveBlockDown = useCallback((blockId: string) => {}, []);

    /**
     * Reorder a block to a specific index within its parent's children array.
     * Used by dnd-kit list components for drag-and-drop reordering.
     */
    const reorderBlock = useCallback(
        (blockId: string, parentId: string, targetIndex: number) => {
            setEnvironment((prev) => {
                const parentTreeId = prev.treeIndex.get(parentId);
                if (!parentTreeId) {
                    console.warn(`Parent block ${parentId} not found in tree index`);
                    return prev;
                }

                const parentTree = findTree(prev, parentTreeId);
                if (!parentTree) {
                    console.warn(`Tree ${parentTreeId} not found`);
                    return prev;
                }

                const { success, payload: updatedRoot } = reorderNode(
                    parentTree.root,
                    parentId,
                    blockId,
                    targetIndex
                );

                if (!success) {
                    console.warn(
                        `Failed to reorder block ${blockId} to index ${targetIndex} in parent ${parentId}`
                    );
                    return prev;
                }

                const updatedTree = {
                    ...parentTree,
                    root: updatedRoot,
                };

                const trees = updateTrees(prev, updatedTree);

                return {
                    ...prev,
                    trees,
                    metadata: updateMetadata(prev.metadata),
                };
            });
        },
        []
    );

    const hydrateEnvironment = useCallback((snapshot: EditorEnvironment) => {
        setEnvironment(cloneEnvironment(snapshot));
    }, []);

    const getEnvironmentSnapshot = useCallback((): EditorEnvironment => {
        return cloneEnvironment(environmentRef.current);
    }, []);

    const value = useMemo<BlockEnvironmentContextValue>(
        () => ({
            environment,
            initialLayout: layoutForGrid,
            blockTreeLayout,
            layoutId,
            isInitialized,
            setIsInitialized,
            addBlock,
            insertBlock,
            removeBlock,
            updateBlock,
            getTrees,
            getBlock,
            moveBlock,
            getParentId,
            getParent,
            getChildren,
            getDescendants,
            isDescendantOf,
            updateHierarchy,
            moveBlockUp,
            moveBlockDown,
            reorderBlock,
            clear,
            hydrateEnvironment,
            getEnvironmentSnapshot,
        }),
        [
            environment,
            layoutForGrid,
            blockTreeLayout,
            layoutId,
            isInitialized,
            addBlock,
            insertBlock,
            removeBlock,
            updateBlock,
            getTrees,
            getBlock,
            moveBlock,
            getParentId,
            getParent,
            getChildren,
            getDescendants,
            isDescendantOf,
            updateHierarchy,
            moveBlockUp,
            moveBlockDown,
            reorderBlock,
            clear,
            hydrateEnvironment,
            getEnvironmentSnapshot,
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
