"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
    BlockNode,
    BlockTree,
    ReferenceCollection,
    isContentNode,
} from "../interface/block.interface";

/* -------------------------------------------------------------------------- */
/*                              Type Definitions                              */
/* -------------------------------------------------------------------------- */

/** GridStack layout rectangle for a block widget. */
export interface EditorLayoutRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** UI-only metadata kept locally by the editor (not persisted). */
export interface EditorBlockUIMetadata {
    collapsed?: boolean;
    locked?: boolean;
}

/** Wrapper for a block tree plus editor-specific layout data. */
export interface EditorBlockInstance {
    tree: BlockTree;
    layout: EditorLayoutRect;
    uiMetadata?: EditorBlockUIMetadata;
}

/** Metadata describing the environment itself. */
export interface EditorEnvironmentMetadata {
    name: string;
    description?: string;
    organisationId: string;
    createdAt: string;
    updatedAt: string;
}

/** Editor representation of a top-level block tree. */
export interface EditorTreeInstance {
    id: string;
    tree: BlockTree;
    layout?: EditorLayoutRect;
}

/**
 * Internal environment model used by the provider.
 * - `trees` holds each top-level block tree.
 * - `hierarchy` maps blockId -> parentBlockId (null for roots).
 * - `treeIndex` maps blockId -> owning tree root id.
 * - `layouts` and `uiMetadata` store per-block editor state.
 */
interface EditorEnvironment {
    trees: EditorTreeInstance[];
    hierarchy: Map<string, string | null>;
    treeIndex: Map<string, string>;
    layouts: Map<string, EditorLayoutRect>;
    uiMetadata: Map<string, EditorBlockUIMetadata>;
    metadata: EditorEnvironmentMetadata;
}

/** Payload returned when exporting the editor state. */
export interface ServerEnvironmentPayload {
    metadata: EditorEnvironmentMetadata;
    blocks: {
        tree: BlockTree;
        layout: EditorLayoutRect;
    }[];
}

/** Context contract exposed to consumers. */
export interface BlockEnvironmentContextValue {
    environment: EditorEnvironment;

    addBlock(tree: BlockTree, layout?: EditorLayoutRect, parentId?: string | null): string;
    removeBlock(blockId: string): void;
    updateBlock(blockId: string, tree: BlockTree): void;
    updateLayout(blockId: string, layout: EditorLayoutRect): void;

    getBlock(blockId: string): EditorBlockInstance | undefined;
    getAllBlocks(): EditorBlockInstance[];
    getTopLevelBlocks(): EditorBlockInstance[];

    insertNestedBlock(
        parentId: string,
        slotName: string,
        childTree: BlockTree,
        layout?: EditorLayoutRect
    ): string;
    promoteToTopLevel(blockId: string, layout?: EditorLayoutRect): void;
    moveBlock(
        blockId: string,
        targetParentId: string | null,
        targetSlot?: string,
        layout?: EditorLayoutRect
    ): void;

    getParent(blockId: string): string | null;
    getChildren(blockId: string, slotName?: string): string[];
    getDescendants(blockId: string): string[];
    isDescendantOf(blockId: string, ancestorId: string): boolean;
    updateHierarchy(blockId: string, newParentId: string | null): void;

    updateUIMetadata(blockId: string, metadata: Partial<EditorBlockUIMetadata>): void;
    duplicateBlock(blockId: string): string | null;

    exportToServer(): ServerEnvironmentPayload;
    clear(): void;
}

const BlockEnvironmentContext = createContext<BlockEnvironmentContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

const DEFAULT_LAYOUT: EditorLayoutRect = { x: 0, y: 0, w: 12, h: 8 };

/** Returns a fresh ISO timestamp. */
const nowIso = () => new Date().toISOString();

/** Convenience check: can we use the Web Crypto API? */
const hasCrypto = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";

/**
 * Generates a client-side block id when we need to promote or duplicate blocks.
 * Random ids keep the demo stable without requiring a backend round-trip.
 */
function generateBlockId(): string {
    return hasCrypto
        ? crypto.randomUUID()
        : `block-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Deep-clone a block tree (preserving all ids). */
function cloneBlockTree(tree: BlockTree): BlockTree {
    return JSON.parse(JSON.stringify(tree));
}

/** Deep-clone a block node (preserving the id). */
function cloneBlockNode(node: BlockNode): BlockNode {
    return JSON.parse(JSON.stringify(node));
}

/**
 * Deep-clone a block tree while assigning new ids to every node.
 * Useful for duplication so the new tree does not clash with existing block ids.
 */
function cloneTreeWithNewIds(tree: BlockTree): BlockTree {
    const idMap = new Map<string, string>();

    const cloneNode = (node: BlockNode): BlockNode => {
        const cloned = cloneBlockNode(node);
        const newId = generateBlockId();
        idMap.set(node.block.id, newId);
        cloned.block.id = newId;

        if (isContentNode(cloned) && cloned.children) {
            cloned.children = Object.fromEntries(
                Object.entries(cloned.children).map(([slot, nodes]) => [
                    slot,
                    nodes.map((child) => cloneNode(child)),
                ])
            );
        }

        // Update any reference collections that point at block ids we have remapped.
        if (cloned.references) {
            Object.values(cloned.references).forEach((collection: ReferenceCollection) => {
                collection.forEach((ref) => {
                    if (
                        "entityType" in ref &&
                        ref.entityType === "BLOCK" &&
                        ref.entityId &&
                        idMap.has(ref.entityId)
                    ) {
                        ref.entityId = idMap.get(ref.entityId)!;
                    }
                });
            });
        }

        return cloned;
    };

    const clonedTree = cloneBlockTree(tree);
    clonedTree.root = cloneNode(tree.root);
    return clonedTree;
}

/** Wrap a single node in a `BlockTree`, preserving depth settings. */
function buildTreeFromNode(node: BlockNode, source: BlockTree): BlockTree {
    return {
        maxDepth: source.maxDepth,
        expandRefs: source.expandRefs,
        root: cloneBlockNode(node),
    };
}

/** Collect descendant ids for a node (used when removing or re-indexing). */
function collectDescendantIds(node: BlockNode, acc: Set<string>): void {
    if (!isContentNode(node) || !node.children) {
        return;
    }

    Object.values(node.children).forEach((slotChildren) => {
        slotChildren.forEach((child) => {
            acc.add(child.block.id);
            collectDescendantIds(child, acc);
        });
    });
}

/**
 * Registers the entire subtree inside the hierarchy, tree index, layout, and UI maps.
 * `skipExistingLayout` lets callers keep a precomputed layout for the root node.
 */
function traverseTree(
    node: BlockNode,
    parentId: string | null,
    treeId: string,
    hierarchy: Map<string, string | null>,
    treeIndex: Map<string, string>,
    layouts: Map<string, EditorLayoutRect>,
    uiMetadata: Map<string, EditorBlockUIMetadata>,
    skipExistingLayout = false
): void {
    const blockId = node.block.id;

    // Record hierarchy + ownership.
    hierarchy.set(blockId, parentId);
    treeIndex.set(blockId, treeId);

    // Lazy initialise layout and UI metadata when absent.
    if (!skipExistingLayout || !layouts.has(blockId)) {
        layouts.set(blockId, layouts.get(blockId) ?? { ...DEFAULT_LAYOUT });
    }
    if (!uiMetadata.has(blockId)) {
        uiMetadata.set(blockId, {});
    }

    if (!isContentNode(node) || !node.children) {
        return;
    }

    Object.values(node.children).forEach((slotChildren) => {
        slotChildren.forEach((child) => {
            traverseTree(child, blockId, treeId, hierarchy, treeIndex, layouts, uiMetadata);
        });
    });
}

/** Depth-first search for a block node. */
function findNodeById(node: BlockNode, targetId: string): BlockNode | undefined {
    if (node.block.id === targetId) {
        return node;
    }

    if (!isContentNode(node) || !node.children) {
        return undefined;
    }

    for (const slotChildren of Object.values(node.children)) {
        for (const child of slotChildren) {
            const match = findNodeById(child, targetId);
            if (match) {
                return match;
            }
        }
    }

    return undefined;
}

interface DetachResult {
    updatedTree: BlockTree;
    detachedNode: BlockNode;
    slotName: string | null;
}

/**
 * Remove a node from a tree and return both the updated tree and the extracted node.
 * Root removal is handled by callers, so we bail out when the requested id is the root.
 */
function detachNode(tree: BlockTree, blockId: string): DetachResult | null {
    if (tree.root.block.id === blockId) {
        return null;
    }

    const rootNode = tree.root;
    if (!isContentNode(rootNode) || !rootNode.children) {
        return null;
    }

    // Try to find the node as an immediate child first.
    for (const [slotName, nodes] of Object.entries(rootNode.children)) {
        const index = nodes.findIndex((node) => node.block.id === blockId);
        if (index >= 0) {
            const newNodes = [...nodes];
            const [detachedNode] = newNodes.splice(index, 1);

            const updatedChildren = { ...rootNode.children };
            if (newNodes.length > 0) {
                updatedChildren[slotName] = newNodes;
            } else {
                delete updatedChildren[slotName];
            }

            return {
                updatedTree: {
                    ...tree,
                    root: {
                        ...rootNode,
                        children: updatedChildren,
                    },
                },
                detachedNode,
                slotName,
            };
        }
    }

    // Otherwise recurse into descendants.
    for (const [slotName, nodes] of Object.entries(rootNode.children)) {
        const newNodes = [...nodes];
        for (let i = 0; i < newNodes.length; i += 1) {
            const child = newNodes[i];
            if (!isContentNode(child)) {
                continue;
            }

            const result = detachNode({ ...tree, root: child }, blockId);
            if (!result) {
                continue;
            }

            newNodes[i] = result.updatedTree.root;
            const updatedChildren = { ...rootNode.children, [slotName]: newNodes };
            return {
                updatedTree: {
                    ...tree,
                    root: {
                        ...rootNode,
                        children: updatedChildren,
                    },
                },
                detachedNode: result.detachedNode,
                slotName: result.slotName,
            };
        }
    }

    return null;
}

/** Insert a node beneath a specific parent/slot, returning a fresh tree instance. */
function insertNode(
    tree: BlockTree,
    parentId: string,
    slotName: string,
    nodeToInsert: BlockNode
): BlockTree {
    const rootNode = tree.root;

    if (rootNode.block.id === parentId) {
        const existingSlot = isContentNode(rootNode) ? rootNode.children?.[slotName] ?? [] : [];
        const newChildren = {
            ...(isContentNode(rootNode) ? rootNode.children : {}),
            [slotName]: [...existingSlot, nodeToInsert],
        };

        return {
            ...tree,
            root: {
                ...rootNode,
                children: newChildren,
            },
        };
    }

    if (!isContentNode(rootNode) || !rootNode.children) {
        return tree;
    }

    const updatedChildren: Record<string, BlockNode[]> = {};
    Object.entries(rootNode.children).forEach(([slot, nodes]) => {
        updatedChildren[slot] = nodes.map((child) => {
            if (!isContentNode(child)) {
                return child;
            }
            return insertNode({ ...tree, root: child }, parentId, slotName, nodeToInsert).root;
        });
    });

    return {
        ...tree,
        root: {
            ...rootNode,
            children: updatedChildren,
        },
    };
}

/** Replace a node in-place, returning a new tree. */
function replaceNode(tree: BlockTree, blockId: string, replacement: BlockNode): BlockTree {
    if (tree.root.block.id === blockId) {
        return {
            ...tree,
            root: replacement,
        };
    }

    const rootNode = tree.root;
    if (!isContentNode(rootNode) || !rootNode.children) {
        return tree;
    }

    const updatedChildren: Record<string, BlockNode[]> = {};
    Object.entries(rootNode.children).forEach(([slot, nodes]) => {
        updatedChildren[slot] = nodes.map((child) => {
            if (child.block.id === blockId) {
                return replacement;
            }
            if (!isContentNode(child)) {
                return child;
            }
            return replaceNode({ ...tree, root: child }, blockId, replacement).root;
        });
    });

    return {
        ...tree,
        root: {
            ...rootNode,
            children: updatedChildren,
        },
    };
}

/**
 * Produces the next available layout slot for a block under `parentId`.
 * Computes the lowest free row by scanning sibling layouts.
 */
function calculateNextLayout(
    layouts: Map<string, EditorLayoutRect>,
    hierarchy: Map<string, string | null>,
    parentId: string | null
): EditorLayoutRect {
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

/** Rehydrate a block instance (tree + layout + UI metadata) by id. */
function materialiseBlockInstance(
    environment: EditorEnvironment,
    blockId: string
): EditorBlockInstance | undefined {
    const treeId = environment.treeIndex.get(blockId);
    if (!treeId) {
        return undefined;
    }

    const treeInstance = environment.trees.find((entry) => entry.id === treeId);
    if (!treeInstance) {
        return undefined;
    }

    const layout = environment.layouts.get(blockId) ?? { ...DEFAULT_LAYOUT };
    const uiMetadata = environment.uiMetadata.get(blockId);

    if (blockId === treeInstance.id) {
        return {
            tree: treeInstance.tree,
            layout,
            uiMetadata,
        };
    }

    const node = findNodeById(treeInstance.tree.root, blockId);
    if (!node) {
        return undefined;
    }

    const childTree = buildTreeFromNode(node, treeInstance.tree);
    return {
        tree: childTree,
        layout,
        uiMetadata,
    };
}

/** Update environment metadata timestamp after a mutation. */
function updateMetadata(metadata: EditorEnvironmentMetadata): EditorEnvironmentMetadata {
    return {
        ...metadata,
        updatedAt: nowIso(),
    };
}

/** Gather every block id contained in a tree. */
function collectTreeBlockIds(tree: BlockTree): string[] {
    const ids: string[] = [tree.root.block.id];
    const stack: BlockNode[] = [tree.root];

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (!isContentNode(node) || !node.children) {
            continue;
        }

        Object.values(node.children).forEach((slotChildren) => {
            slotChildren.forEach((child) => {
                ids.push(child.block.id);
                stack.push(child);
            });
        });
    }

    return ids;
}

/**
 * Initialise an empty editor environment for the given organisation id.
 */
function createEmptyEnvironment(organisationId: string): EditorEnvironment {
    const timestamp = nowIso();

    return {
        trees: [],
        hierarchy: new Map(),
        treeIndex: new Map(),
        layouts: new Map(),
        uiMetadata: new Map(),
        metadata: {
            name: "Untitled Environment",
            organisationId,
            description: undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    };
}

/**
 * Hydrate an environment from a set of top-level tree instances supplied by callers.
 */
function normaliseEnvironment(
    initialTrees: EditorTreeInstance[] | undefined,
    organisationId: string
): EditorEnvironment {
    if (!initialTrees || initialTrees.length === 0) {
        return createEmptyEnvironment(organisationId);
    }

    const clonedTrees = initialTrees.map((instance) => ({
        id: instance.id,
        tree: cloneBlockTree(instance.tree),
        layout: instance.layout,
    }));

    const hierarchy = new Map<string, string | null>();
    const treeIndex = new Map<string, string>();
    const layouts = new Map<string, EditorLayoutRect>();
    const uiMetadata = new Map<string, EditorBlockUIMetadata>();

    clonedTrees.forEach((instance, index) => {
        const rootId = instance.id;
        const rootLayout = instance.layout ?? {
            ...DEFAULT_LAYOUT,
            y: index * (DEFAULT_LAYOUT.h + 1),
        };

        hierarchy.set(rootId, null);
        treeIndex.set(rootId, rootId);
        layouts.set(rootId, rootLayout);
        uiMetadata.set(rootId, {});

        const rootNode = instance.tree.root;
        if (isContentNode(rootNode) && rootNode.children) {
            Object.values(rootNode.children).forEach((slotChildren) => {
                slotChildren.forEach((child) => {
                    traverseTree(child, rootId, rootId, hierarchy, treeIndex, layouts, uiMetadata);
                });
            });
        }
    });

    return {
        trees: clonedTrees,
        hierarchy,
        treeIndex,
        layouts,
        uiMetadata,
        metadata: {
            name: "Untitled Environment",
            description: undefined,
            organisationId,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        },
    };
}

/* -------------------------------------------------------------------------- */
/*                                  Provider                                  */
/* -------------------------------------------------------------------------- */

export interface BlockEnvironmentProviderProps {
    organisationId: string;
    initialTrees?: EditorTreeInstance[];
    children: React.ReactNode;
}

/**
 * Provides state and helpers for the block environment editor.
 */
export const BlockEnvironmentProvider: React.FC<BlockEnvironmentProviderProps> = ({
    organisationId,
    initialTrees,
    children,
}) => {
    const [environment, setEnvironment] = useState<EditorEnvironment>(() =>
        normaliseEnvironment(initialTrees, organisationId)
    );

    /**
     * Add either a top-level block tree (when `parentId` is null)
     * or a nested block inside an existing parent.
     */
    const addBlock = useCallback(
        (tree: BlockTree, layout?: EditorLayoutRect, parentId: string | null = null): string => {
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
                const uiMetadata = new Map(prev.uiMetadata);

                const layoutForRoot = layout ?? calculateNextLayout(layouts, hierarchy, null);
                layouts.set(rootId, layoutForRoot);
                hierarchy.set(rootId, null);
                treeIndex.set(rootId, rootId);
                uiMetadata.set(rootId, {});

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
        },
        []
    );

    /** Remove a block tree (top-level) or a nested block from its parent. */
    const removeBlock = useCallback((blockId: string): void => {
        setEnvironment((prev) => {
            const treeId = prev.treeIndex.get(blockId);
            if (!treeId) {
                return prev;
            }

            const layouts = new Map(prev.layouts);
            const hierarchy = new Map(prev.hierarchy);
            const treeIndex = new Map(prev.treeIndex);
            const uiMetadata = new Map(prev.uiMetadata);
            let trees = [...prev.trees];

            const isRoot = blockId === treeId;
            if (isRoot) {
                // Drop the entire tree and all of its descendants.
                trees = trees.filter((instance) => instance.id !== blockId);
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

    /** Return the set of top-level block trees. */
    const getTopLevelBlocks = useCallback((): EditorBlockInstance[] => {
        return environment.trees
            .map((instance) => materialiseBlockInstance(environment, instance.id))
            .filter((entry): entry is EditorBlockInstance => Boolean(entry));
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

                // Nothing changed – optionally persist the new layout.
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
                const targetTreeInstance = prev.trees.find((instance) => instance.id === targetTreeId);
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

                const nextLayout = layout ?? calculateNextLayout(layouts, hierarchy, targetParentId);
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

    /** Duplicate a block tree (with fresh ids) either at top-level or within the same parent. */
    const duplicateBlock = useCallback(
        (blockId: string): string | null => {
            const source = materialiseBlockInstance(environment, blockId);
            if (!source) {
                return null;
            }

            const clonedTree = cloneTreeWithNewIds(source.tree);
            const newRootId = clonedTree.root.block.id;
            const parentId = environment.hierarchy.get(blockId) ?? null;

            const layout = {
                ...source.layout,
                y: source.layout.y + source.layout.h + 1,
            };

            if (parentId === null) {
                addBlock(clonedTree, layout, null);
                return newRootId;
            }

            insertNestedBlock(parentId, "main", clonedTree, layout);
            return newRootId;
        },
        [environment, addBlock, insertNestedBlock]
    );

    /** Prepare a serialisable payload for persistence. */
    const exportToServer = useCallback((): ServerEnvironmentPayload => {
        const blocks = environment.trees.map((instance) => ({
            tree: instance.tree,
            layout: environment.layouts.get(instance.id) ?? { ...DEFAULT_LAYOUT },
        }));
        return {
            metadata: environment.metadata,
            blocks,
        };
    }, [environment]);

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
            duplicateBlock,
            exportToServer,
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
            duplicateBlock,
            exportToServer,
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
    const childId = childTree.root.block.id;
    const childNode = cloneBlockNode(childTree.root);

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

        traverseTree(childNode, parentId, parentTreeId, hierarchy, treeIndex, layouts, uiMetadata, true);

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
