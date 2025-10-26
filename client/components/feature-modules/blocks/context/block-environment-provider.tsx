"use client";

import {
    BlockNode,
    BlockTree,
} from "@/components/feature-modules/blocks/interface/block.interface";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Editor-specific layout rectangle for GridStack positioning
 */
export interface EditorLayoutRect {
    x: number; // Grid column position (0-based)
    y: number; // Grid row position (0-based)
    w: number; // Width in columns
    h: number; // Height in rows
}

/**
 * Editor-specific UI metadata (not persisted to backend)
 */
export interface EditorBlockUIMetadata {
    collapsed?: boolean; // Collapsed state in UI
    locked?: boolean; // Prevent editing/moving
}

/**
 * Editor block instance - wraps BlockTree with editor-specific data
 */
export interface EditorBlockInstance {
    tree: BlockTree; // The actual block data
    layout: EditorLayoutRect; // GridStack position
    uiMetadata?: EditorBlockUIMetadata; // Optional UI state
}

/**
 * Tracks hierarchical relationships between blocks
 * Maps blockId -> parentId (null for top-level blocks)
 */
export interface EditorHierarchy {
    parentMap: Map<string, string | null>;
}

/**
 * Environment-level metadata
 */
export interface EditorEnvironmentMetadata {
    name: string;
    description?: string;
    organisationId: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Complete editor environment state
 */
export interface EditorEnvironment {
    blocks: EditorBlockInstance[]; // All blocks (top-level + nested)
    hierarchy: EditorHierarchy; // Parent-child relationships
    metadata: EditorEnvironmentMetadata;
}

/**
 * Options for creating a new block
 */
export interface CreateBlockOptions {
    tree: BlockTree;
    layout?: Partial<EditorLayoutRect>;
    parentId?: string | null;
    slotName?: string;
}

/**
 * Payload for exporting environment to server
 */
export interface ServerEnvironmentPayload {
    metadata: EditorEnvironmentMetadata;
    blocks: {
        tree: BlockTree;
        layout: EditorLayoutRect;
        parentId?: string | null;
    }[];
}

/* -------------------------------------------------------------------------- */
/*                              Context Definition                            */
/* -------------------------------------------------------------------------- */

export interface BlockEnvironmentContextValue {
    // State
    environment: EditorEnvironment;

    // Block operations
    addBlock(tree: BlockTree, layout?: EditorLayoutRect, parentId?: string | null): string;
    removeBlock(blockId: string): void;
    updateBlock(blockId: string, tree: BlockTree): void;
    updateLayout(blockId: string, layout: EditorLayoutRect): void;
    getBlock(blockId: string): EditorBlockInstance | undefined;
    getAllBlocks(): EditorBlockInstance[];
    getTopLevelBlocks(): EditorBlockInstance[];

    // Nesting operations
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

    // Hierarchy queries
    getParent(blockId: string): string | null;
    getChildren(blockId: string, slotName?: string): string[];
    getDescendants(blockId: string): string[];
    isDescendantOf(blockId: string, ancestorId: string): boolean;
    updateHierarchy(blockId: string, newParentId: string | null): void;

    // UI metadata
    updateUIMetadata(blockId: string, metadata: Partial<EditorBlockUIMetadata>): void;

    // Utilities
    duplicateBlock(blockId: string): string | null;
    exportToServer(): ServerEnvironmentPayload;
    clear(): void;
}

const BlockEnvironmentContext = createContext<BlockEnvironmentContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*                                 Provider                                   */
/* -------------------------------------------------------------------------- */

export interface BlockEnvironmentProviderProps {
    initialEnvironment?: EditorEnvironment;
    organisationId: string;
    children: React.ReactNode;
}

export const BlockEnvironmentProvider: React.FC<BlockEnvironmentProviderProps> = ({
    initialEnvironment,
    organisationId,
    children,
}) => {
    const [environment, setEnvironment] = useState<EditorEnvironment>(
        initialEnvironment ?? createEmptyEnvironment(organisationId)
    );

    console.log(environment);

    /* --------------------------- Block Operations --------------------------- */

    const addBlock = useCallback(
        (tree: BlockTree, layout?: EditorLayoutRect, parentId: string | null = null): string => {
            const blockId = tree.root.block.id;

            setEnvironment((prev) => {
                // Check if block already exists
                if (prev.blocks.some((b) => b.tree.root.block.id === blockId)) {
                    console.warn(`Block ${blockId} already exists in environment`);
                    return prev;
                }

                // Calculate default layout if not provided
                const finalLayout = layout ?? calculateNextLayout(prev.blocks, parentId);

                const newInstance: EditorBlockInstance = {
                    tree,
                    layout: finalLayout,
                    uiMetadata: {},
                };

                // Update hierarchy
                const updatedParentMap = new Map(prev.hierarchy.parentMap);
                updatedParentMap.set(blockId, parentId);

                return {
                    ...prev,
                    blocks: [...prev.blocks, newInstance],
                    hierarchy: {
                        parentMap: updatedParentMap,
                    },
                    metadata: {
                        ...prev.metadata,
                        updatedAt: new Date().toISOString(),
                    },
                };
            });

            return blockId;
        },
        []
    );

    const removeBlock = useCallback((blockId: string): void => {
        setEnvironment((prev) => {
            // Get current descendants from real-time hierarchy
            const descendantsToDelete = getDescendantsImpl(blockId, prev.hierarchy.parentMap);
            const allToDelete = [blockId, ...descendantsToDelete];

            // Remove from blocks array
            const updatedBlocks = prev.blocks.filter(
                (b) => !allToDelete.includes(b.tree.root.block.id)
            );

            // Update hierarchy (remove entries)
            const updatedParentMap = new Map(prev.hierarchy.parentMap);
            allToDelete.forEach((id) => updatedParentMap.delete(id));

            // If block had a parent, update parent's BlockTree.children
            const parentId = prev.hierarchy.parentMap.get(blockId);
            if (parentId) {
                const parentInstance = prev.blocks.find((b) => b.tree.root.block.id === parentId);

                if (parentInstance) {
                    // Remove from parent's BlockTree slots
                    const updatedParentTree = removeChildFromBlockTree(
                        parentInstance.tree,
                        blockId
                    );

                    // Update parent in blocks array
                    const blockIndex = updatedBlocks.findIndex(
                        (b) => b.tree.root.block.id === parentId
                    );
                    if (blockIndex >= 0) {
                        updatedBlocks[blockIndex] = {
                            ...updatedBlocks[blockIndex],
                            tree: updatedParentTree,
                        };
                    }
                }
            }

            return {
                ...prev,
                blocks: updatedBlocks,
                hierarchy: {
                    parentMap: updatedParentMap,
                },
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            };
        });
    }, []);

    const updateBlock = useCallback((blockId: string, tree: BlockTree): void => {
        setEnvironment((prev) => {
            const blockIndex = prev.blocks.findIndex((b) => b.tree.root.block.id === blockId);
            if (blockIndex === -1) {
                console.warn(`Block ${blockId} not found in environment`);
                return prev;
            }

            const updatedBlocks = [...prev.blocks];
            updatedBlocks[blockIndex] = {
                ...updatedBlocks[blockIndex],
                tree,
            };

            return {
                ...prev,
                blocks: updatedBlocks,
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            };
        });
    }, []);

    const updateLayout = useCallback((blockId: string, layout: EditorLayoutRect): void => {
        setEnvironment((prev) => {
            const blockIndex = prev.blocks.findIndex((b) => b.tree.root.block.id === blockId);
            if (blockIndex === -1) {
                return prev;
            }

            const updatedBlocks = [...prev.blocks];
            updatedBlocks[blockIndex] = {
                ...updatedBlocks[blockIndex],
                layout,
            };

            return {
                ...prev,
                blocks: updatedBlocks,
            };
        });
    }, []);

    const getBlock = useCallback(
        (blockId: string): EditorBlockInstance | undefined => {
            return environment.blocks.find((b) => b.tree.root.block.id === blockId);
        },
        [environment.blocks]
    );

    const getAllBlocks = useCallback((): EditorBlockInstance[] => {
        return environment.blocks;
    }, [environment.blocks]);

    const getTopLevelBlocks = useCallback((): EditorBlockInstance[] => {
        return environment.blocks.filter((b) => {
            const parent = environment.hierarchy.parentMap.get(b.tree.root.block.id);
            return parent === null || parent === undefined;
        });
    }, [environment.blocks, environment.hierarchy.parentMap]);

    /* -------------------------- Nesting Operations -------------------------- */

    const insertNestedBlock = useCallback(
        (
            parentId: string,
            slotName: string,
            childTree: BlockTree,
            layout?: EditorLayoutRect
        ): string => {
            const childId = childTree.root.block.id;

            setEnvironment((prev) => {
                const parentInstance = prev.blocks.find((b) => b.tree.root.block.id === parentId);
                if (!parentInstance) {
                    console.warn(`Parent block ${parentId} not found`);
                    return prev;
                }

                // Check if parent can nest
                if (!parentInstance.tree.root.block.type.nesting) {
                    console.warn(`Parent block ${parentId} does not allow nesting`);
                    return prev;
                }

                // Add child to parent's BlockTree
                const updatedParentTree = addChildToBlockTree(
                    parentInstance.tree,
                    slotName,
                    childTree.root
                );

                // Update parent in blocks array
                const updatedBlocks = prev.blocks.map((b) =>
                    b.tree.root.block.id === parentId ? { ...b, tree: updatedParentTree } : b
                );

                // Calculate layout for nested child
                const childLayout = layout ?? calculateNextLayout(prev.blocks, parentId, slotName);

                // Add child as separate block instance
                const childInstance: EditorBlockInstance = {
                    tree: childTree,
                    layout: childLayout,
                    uiMetadata: {},
                };
                updatedBlocks.push(childInstance);

                // Update hierarchy
                const updatedParentMap = new Map(prev.hierarchy.parentMap);
                updatedParentMap.set(childId, parentId);

                return {
                    ...prev,
                    blocks: updatedBlocks,
                    hierarchy: {
                        parentMap: updatedParentMap,
                    },
                    metadata: {
                        ...prev.metadata,
                        updatedAt: new Date().toISOString(),
                    },
                };
            });

            return childId;
        },
        []
    );

    const promoteToTopLevel = useCallback((blockId: string, layout?: EditorLayoutRect): void => {
        setEnvironment((prev) => {
            console.log(`[promoteToTopLevel] Starting promotion for block ${blockId}`);
            console.log(`[promoteToTopLevel] Current blocks count: ${prev.blocks.length}`);
            console.log(
                `[promoteToTopLevel] Current hierarchy:`,
                Object.fromEntries(prev.hierarchy.parentMap)
            );

            const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
            if (!blockInstance) {
                console.warn(`Block ${blockId} not found`);
                return prev;
            }

            const currentParent = prev.hierarchy.parentMap.get(blockId);
            console.log(`[promoteToTopLevel] Current parent of ${blockId}: ${currentParent}`);

            if (!currentParent) {
                console.warn(`Block ${blockId} is already top-level`);
                return prev;
            }

            // Remove from parent's BlockTree and extract child as new BlockTree
            const parentInstance = prev.blocks.find((b) => b.tree.root.block.id === currentParent);
            let updatedBlocks = [...prev.blocks];
            let extractedTree: BlockTree | null = null;

            if (parentInstance) {
                // Extract the child as a complete BlockTree (with child as root)
                extractedTree = extractBlockAsTree(parentInstance.tree, blockId);
                console.log(`[promoteToTopLevel] Extracted ${blockId} as new BlockTree`);

                // Remove from parent's children
                const updatedParentTree = removeChildFromBlockTree(parentInstance.tree, blockId);
                updatedBlocks = updatedBlocks.map((b) =>
                    b.tree.root.block.id === currentParent ? { ...b, tree: updatedParentTree } : b
                );
                console.log(
                    `[promoteToTopLevel] Removed ${blockId} from parent ${currentParent}'s BlockTree`
                );
            }

            // Update block's tree and layout
            updatedBlocks = updatedBlocks.map((b) => {
                if (b.tree.root.block.id === blockId) {
                    return {
                        ...b,
                        tree: extractedTree ?? b.tree, // Use extracted tree or keep existing
                        layout: layout ?? b.layout,
                    };
                }
                return b;
            });

            if (layout) {
                console.log(`[promoteToTopLevel] Updated layout for ${blockId}:`, layout);
            }
            if (extractedTree) {
                console.log(
                    `[promoteToTopLevel] Updated BlockTree for ${blockId} - now a root-level tree`
                );
            }

            // Update hierarchy to null (top-level)
            const updatedParentMap = new Map(prev.hierarchy.parentMap);
            updatedParentMap.set(blockId, null);

            console.log(`[promoteToTopLevel] Updated blocks count: ${updatedBlocks.length}`);
            console.log(
                `[promoteToTopLevel] Updated hierarchy:`,
                Object.fromEntries(updatedParentMap)
            );

            const newState = {
                ...prev,
                blocks: updatedBlocks,
                hierarchy: {
                    parentMap: updatedParentMap,
                },
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            };

            // Verify the promoted block is now top-level
            const topLevelCount = Array.from(updatedParentMap.entries()).filter(
                ([_, parent]) => parent === null || parent === undefined
            ).length;
            console.log(`[promoteToTopLevel] Top-level blocks after promotion: ${topLevelCount}`);

            return newState;
        });
    }, []);

    const moveBlock = useCallback(
        (
            blockId: string,
            targetParentId: string | null,
            targetSlot: string = "main",
            layout?: EditorLayoutRect
        ): void => {
            setEnvironment((prev) => {
                const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
                if (!blockInstance) {
                    console.warn(`Block ${blockId} not found`);
                    return prev;
                }

                const currentParentId = prev.hierarchy.parentMap.get(blockId) ?? null;

                console.log(
                    `[moveBlock] Moving ${blockId} from parent ${currentParentId} to ${targetParentId}`
                );

                // Case 1: Moving to top-level (promotion)
                if (targetParentId === null) {
                    if (currentParentId === null) {
                        // Already top-level, just update layout
                        return handleLayoutChange(prev, blockId, layout);
                    }
                    // Delegate to promoteToTopLevel logic (inline here to avoid state issues)
                    const parentInstance = prev.blocks.find(
                        (b) => b.tree.root.block.id === currentParentId
                    );
                    let updatedBlocks = [...prev.blocks];
                    let extractedTree: BlockTree | null = null;

                    if (parentInstance) {
                        extractedTree = extractBlockAsTree(parentInstance.tree, blockId);
                        const updatedParentTree = removeChildFromBlockTree(
                            parentInstance.tree,
                            blockId
                        );
                        updatedBlocks = updatedBlocks.map((b) =>
                            b.tree.root.block.id === currentParentId
                                ? { ...b, tree: updatedParentTree }
                                : b
                        );
                    }

                    updatedBlocks = updatedBlocks.map((b) => {
                        if (b.tree.root.block.id === blockId) {
                            return {
                                ...b,
                                tree: extractedTree ?? b.tree,
                                layout: layout ?? b.layout,
                            };
                        }
                        return b;
                    });

                    const updatedParentMap = new Map(prev.hierarchy.parentMap);
                    updatedParentMap.set(blockId, null);

                    console.log(`[moveBlock] Promoted ${blockId} to top-level`);

                    return {
                        ...prev,
                        blocks: updatedBlocks,
                        hierarchy: { parentMap: updatedParentMap },
                        metadata: {
                            ...prev.metadata,
                            updatedAt: new Date().toISOString(),
                        },
                    };
                }

                // Case 2: Moving from top-level to nested (demotion)
                if (currentParentId === null && targetParentId !== null) {
                    console.log(
                        `[moveBlock] Demoting ${blockId} to nested under ${targetParentId}`
                    );
                    return handleDemotion(prev, blockId, targetParentId, targetSlot, layout);
                }

                // Case 3: Moving between different parents (relocation)
                if (currentParentId !== targetParentId) {
                    console.log(
                        `[moveBlock] Relocating ${blockId} from ${currentParentId} to ${targetParentId}`
                    );
                    return handleRelocation(
                        prev,
                        blockId,
                        currentParentId,
                        targetParentId,
                        targetSlot,
                        layout
                    );
                }

                // Case 4: Same parent, just layout change
                console.log(`[moveBlock] Updating layout for ${blockId}`);
                return handleLayoutChange(prev, blockId, layout);
            });
        },
        []
    );

    /* -------------------------- Hierarchy Queries --------------------------- */

    const getParent = useCallback(
        (blockId: string): string | null => {
            return environment.hierarchy.parentMap.get(blockId) ?? null;
        },
        [environment.hierarchy.parentMap]
    );

    const getChildren = useCallback(
        (blockId: string, slotName?: string): string[] => {
            const children = Array.from(environment.hierarchy.parentMap.entries())
                .filter(([_, parent]) => parent === blockId)
                .map(([childId]) => childId);

            // If slotName specified, filter by slot
            if (slotName) {
                const parentBlock = environment.blocks.find(
                    (b) => b.tree.root.block.id === blockId
                );
                if (!parentBlock) return [];

                const slotChildren = parentBlock.tree.root.children[slotName] || [];
                const slotChildIds = slotChildren.map((node) => node.block.id);

                return children.filter((childId) => slotChildIds.includes(childId));
            }

            return children;
        },
        [environment.blocks, environment.hierarchy.parentMap]
    );

    const getDescendants = useCallback(
        (blockId: string): string[] => {
            return getDescendantsImpl(blockId, environment.hierarchy.parentMap);
        },
        [environment.hierarchy.parentMap]
    );

    const isDescendantOf = useCallback(
        (blockId: string, ancestorId: string): boolean => {
            let currentId: string | null = blockId;

            while (currentId) {
                const parent = environment.hierarchy.parentMap.get(currentId);
                if (parent === ancestorId) return true;
                currentId = parent ?? null;
            }

            return false;
        },
        [environment.hierarchy.parentMap]
    );

    const updateHierarchy = useCallback((blockId: string, newParentId: string | null): void => {
        setEnvironment((prev) => {
            const updatedParentMap = new Map(prev.hierarchy.parentMap);
            updatedParentMap.set(blockId, newParentId);

            return {
                ...prev,
                hierarchy: {
                    parentMap: updatedParentMap,
                },
            };
        });
    }, []);

    /* ---------------------------- UI Metadata ------------------------------- */

    const updateUIMetadata = useCallback(
        (blockId: string, metadata: Partial<EditorBlockUIMetadata>): void => {
            setEnvironment((prev) => {
                const blockIndex = prev.blocks.findIndex((b) => b.tree.root.block.id === blockId);
                if (blockIndex === -1) {
                    return prev;
                }

                const updatedBlocks = [...prev.blocks];
                updatedBlocks[blockIndex] = {
                    ...updatedBlocks[blockIndex],
                    uiMetadata: {
                        ...updatedBlocks[blockIndex].uiMetadata,
                        ...metadata,
                    },
                };

                return {
                    ...prev,
                    blocks: updatedBlocks,
                };
            });
        },
        []
    );

    /* ----------------------------- Utilities -------------------------------- */

    const duplicateBlock = useCallback((blockId: string): string | null => {
        let newBlockId: string | null = null;

        setEnvironment((prev) => {
            const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
            if (!blockInstance) {
                console.warn(`Block ${blockId} not found`);
                return prev;
            }

            // Clone the tree with new IDs
            const clonedTree = cloneBlockTree(blockInstance.tree);
            newBlockId = clonedTree.root.block.id;

            // Calculate new layout position (offset from original)
            const newLayout: EditorLayoutRect = {
                x: blockInstance.layout.x,
                y: blockInstance.layout.y + blockInstance.layout.h + 1,
                w: blockInstance.layout.w,
                h: blockInstance.layout.h,
            };

            // Get parent (duplicate maintains same parent level)
            const parentId = prev.hierarchy.parentMap.get(blockId) ?? null;

            // Create new instance
            const newInstance: EditorBlockInstance = {
                tree: clonedTree,
                layout: newLayout,
                uiMetadata: { ...blockInstance.uiMetadata },
            };

            // Update hierarchy
            const updatedParentMap = new Map(prev.hierarchy.parentMap);
            updatedParentMap.set(newBlockId, parentId);

            console.log(`Duplicated block ${blockId} as ${newBlockId}`);

            return {
                ...prev,
                blocks: [...prev.blocks, newInstance],
                hierarchy: {
                    parentMap: updatedParentMap,
                },
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            };
        });

        return newBlockId;
    }, []);

    const exportToServer = useCallback((): ServerEnvironmentPayload => {
        return {
            metadata: environment.metadata,
            blocks: environment.blocks.map((b) => ({
                tree: b.tree,
                layout: b.layout,
                parentId: environment.hierarchy.parentMap.get(b.tree.root.block.id) ?? null,
            })),
        };
    }, [environment]);

    const clear = useCallback((): void => {
        setEnvironment(createEmptyEnvironment(organisationId));
    }, [organisationId]);

    /* ---------------------------- Context Value ----------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                   Hook                                     */
/* -------------------------------------------------------------------------- */

export const useBlockEnvironment = (): BlockEnvironmentContextValue => {
    const context = useContext(BlockEnvironmentContext);
    if (!context) {
        throw new Error("useBlockEnvironment must be used within BlockEnvironmentProvider");
    }
    return context;
};

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

/**
 * Creates an empty environment
 */
function createEmptyEnvironment(organisationId: string): EditorEnvironment {
    return {
        blocks: [],
        hierarchy: {
            parentMap: new Map(),
        },
        metadata: {
            name: "Untitled Environment",
            organisationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    };
}

/**
 * Calculates the next available layout position
 */
function calculateNextLayout(
    blocks: EditorBlockInstance[],
    parentId: string | null,
    _slotName?: string
): EditorLayoutRect {
    // Filter blocks by parent
    const siblingBlocks = blocks.filter((b) => {
        // For this calculation, we need to check which blocks share the same parent
        // This is a simplified version - GridStack will handle actual positioning
        return true; // Simplified: just use all blocks for now
    });

    // Find maximum Y position + height
    let maxY = 0;
    siblingBlocks.forEach((b) => {
        const bottom = b.layout.y + b.layout.h;
        if (bottom > maxY) maxY = bottom;
    });

    return {
        x: 0,
        y: maxY > 0 ? maxY + 1 : 0,
        w: 12,
        h: 8,
    };
}

/**
 * Gets all descendants of a block (recursive)
 */
function getDescendantsImpl(blockId: string, parentMap: Map<string, string | null>): string[] {
    const descendants: string[] = [];
    const children = Array.from(parentMap.entries())
        .filter(([_, parent]) => parent === blockId)
        .map(([childId]) => childId);

    children.forEach((childId) => {
        descendants.push(childId);
        descendants.push(...getDescendantsImpl(childId, parentMap));
    });

    return descendants;
}

/**
 * Removes a child block from a BlockTree's slots
 */
function removeChildFromBlockTree(tree: BlockTree, childId: string): BlockTree {
    const updatedChildren: Record<string, (typeof tree.root.children)[string]> = {};

    for (const [slotName, nodes] of Object.entries(tree.root.children)) {
        updatedChildren[slotName] = nodes.filter((node) => node.block.id !== childId);
    }

    return {
        ...tree,
        root: {
            ...tree.root,
            children: updatedChildren,
        },
    };
}

/**
 * Adds a child block to a BlockTree's slot
 */
function addChildToBlockTree(
    tree: BlockTree,
    slotName: string,
    childNode: typeof tree.root
): BlockTree {
    const existingSlot = tree.root.children[slotName] || [];

    return {
        ...tree,
        root: {
            ...tree.root,
            children: {
                ...tree.root.children,
                [slotName]: [...existingSlot, childNode],
            },
        },
    };
}

/**
 * Extracts a child BlockNode from parent's tree and creates a new BlockTree with it as root
 * Used when promoting a nested block to top-level
 */
function extractBlockAsTree(parentTree: BlockTree, childId: string): BlockTree {
    // Find child in parent's children slots
    for (const [_slotName, nodes] of Object.entries(parentTree.root.children)) {
        const childNode = nodes.find((node) => node.block.id === childId);

        if (childNode) {
            // Create new BlockTree with child as root
            return {
                maxDepth: parentTree.maxDepth,
                expandRefs: parentTree.expandRefs,
                root: childNode,
            };
        }
    }

    throw new Error(`Child ${childId} not found in parent tree`);
}

/**
 * Clones a BlockTree with new IDs
 */
function cloneBlockTree(tree: BlockTree): BlockTree {
    const newId = generateBlockId();

    const clonedRoot = cloneBlockNode(tree.root, newId);

    return {
        ...tree,
        root: clonedRoot,
    };
}

/**
 * Clones a BlockNode with new ID
 */
function cloneBlockNode(node: BlockNode, newId?: string): BlockNode {
    const nodeId = newId ?? generateBlockId();

    const clonedChildren: Record<string, BlockNode[]> = {};
    for (const [slotName, nodes] of Object.entries(node.children)) {
        clonedChildren[slotName] = nodes.map((child) => cloneBlockNode(child));
    }

    return {
        ...node,
        block: {
            ...node.block,
            id: nodeId,
        },
        children: clonedChildren,
    };
}

/**
 * Handles moving a block from top-level to nested (demotion)
 * Destroys the BlockTree and inserts the root BlockNode into parent's children
 */
function handleDemotion(
    prev: EditorEnvironment,
    blockId: string,
    targetParentId: string,
    targetSlot: string,
    layout?: EditorLayoutRect
): EditorEnvironment {
    const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
    const targetParent = prev.blocks.find((b) => b.tree.root.block.id === targetParentId);

    if (!blockInstance || !targetParent) return prev;

    // Check if target parent allows nesting
    if (!targetParent.tree.root.block.type.nesting) {
        console.warn(`Target parent ${targetParentId} does not allow nesting`);
        return prev;
    }

    // Extract the root BlockNode from the BlockTree (destroying the tree)
    const blockNode = blockInstance.tree.root;

    // Add block node to target parent's children
    const updatedTargetTree = addChildToBlockTree(targetParent.tree, targetSlot, blockNode);

    // Update blocks array
    let updatedBlocks = prev.blocks.map((b) =>
        b.tree.root.block.id === targetParentId ? { ...b, tree: updatedTargetTree } : b
    );

    // Update layout if provided
    if (layout) {
        updatedBlocks = updatedBlocks.map((b) =>
            b.tree.root.block.id === blockId ? { ...b, layout } : b
        );
    }

    // Update hierarchy
    const updatedParentMap = new Map(prev.hierarchy.parentMap);
    updatedParentMap.set(blockId, targetParentId);

    return {
        ...prev,
        blocks: updatedBlocks,
        hierarchy: { parentMap: updatedParentMap },
        metadata: {
            ...prev.metadata,
            updatedAt: new Date().toISOString(),
        },
    };
}

/**
 * Handles moving a block between two different parents
 */
function handleRelocation(
    prev: EditorEnvironment,
    blockId: string,
    currentParentId: string | null,
    targetParentId: string,
    targetSlot: string,
    layout?: EditorLayoutRect
): EditorEnvironment {
    const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
    const targetParent = prev.blocks.find((b) => b.tree.root.block.id === targetParentId);

    if (!blockInstance || !targetParent) return prev;

    // Check if target parent allows nesting
    if (!targetParent.tree.root.block.type.nesting) {
        console.warn(`Target parent ${targetParentId} does not allow nesting`);
        return prev;
    }

    let updatedBlocks = [...prev.blocks];

    // Remove from current parent
    if (currentParentId) {
        const currentParent = prev.blocks.find((b) => b.tree.root.block.id === currentParentId);
        if (currentParent) {
            const updatedCurrentTree = removeChildFromBlockTree(currentParent.tree, blockId);
            updatedBlocks = updatedBlocks.map((b) =>
                b.tree.root.block.id === currentParentId ? { ...b, tree: updatedCurrentTree } : b
            );
        }
    }

    // Extract the BlockNode from current tree (whether it's top-level or nested)
    const blockNode = blockInstance.tree.root;

    // Add to target parent
    const updatedTargetTree = addChildToBlockTree(targetParent.tree, targetSlot, blockNode);

    updatedBlocks = updatedBlocks.map((b) =>
        b.tree.root.block.id === targetParentId ? { ...b, tree: updatedTargetTree } : b
    );

    // Update layout if provided
    if (layout) {
        updatedBlocks = updatedBlocks.map((b) =>
            b.tree.root.block.id === blockId ? { ...b, layout } : b
        );
    }

    // Update hierarchy
    const updatedParentMap = new Map(prev.hierarchy.parentMap);
    updatedParentMap.set(blockId, targetParentId);

    return {
        ...prev,
        blocks: updatedBlocks,
        hierarchy: { parentMap: updatedParentMap },
        metadata: {
            ...prev.metadata,
            updatedAt: new Date().toISOString(),
        },
    };
}

/**
 * Handles simple layout change without parent change
 */
function handleLayoutChange(
    prev: EditorEnvironment,
    blockId: string,
    layout?: EditorLayoutRect
): EditorEnvironment {
    if (!layout) return prev;

    const updatedBlocks = prev.blocks.map((b) =>
        b.tree.root.block.id === blockId ? { ...b, layout } : b
    );

    return {
        ...prev,
        blocks: updatedBlocks,
        metadata: {
            ...prev.metadata,
            updatedAt: new Date().toISOString(),
        },
    };
}

/**
 * Generates a unique block ID
 */
function generateBlockId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `block-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
