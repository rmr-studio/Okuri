/**
 * Editor Environment Provider
 *
 * Manages the state of the block editor environment - a collection of BlockTree
 * instances with their layout positions and metadata.
 */
"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { BlockTree } from "../interface/block.interface";
import {
    CreateBlockOptions,
    EditorBlockInstance,
    EditorEnvironment,
    EditorLayoutRect,
    InsertNestedBlockOptions,
    ServerEnvironmentPayload,
} from "../interface/editor.interface";
import { BlockTreeBuilder } from "../util/block-tree.builder";
import { useEditorLayout } from "./editor-layout-provider";

/**
 * Context value for the editor environment
 */
interface EditorEnvironmentContextValue {
    /** Current environment state */
    environment: EditorEnvironment;

    /** Add a new top-level block */
    addBlock(tree: BlockTree, layout?: EditorLayoutRect): string;

    /** Remove a block and its descendants */
    removeBlock(blockId: string): void;

    /** Update a block's tree (data changes) */
    updateBlock(blockId: string, tree: BlockTree): void;

    /** Update a block's layout position */
    updateLayout(blockId: string, layout: EditorLayoutRect): void;

    /** Get a specific block by ID */
    getBlock(blockId: string): EditorBlockInstance | undefined;

    /** Get all blocks */
    getAllBlocks(): EditorBlockInstance[];

    /** Insert a nested block into a parent's slot */
    insertNestedBlock(options: InsertNestedBlockOptions): void;

    /** Create a new block from options */
    createBlock(options: CreateBlockOptions): string;

    /** Duplicate an existing block */
    duplicateBlock(blockId: string): string | undefined;

    /** Update environment metadata */
    updateMetadata(metadata: Partial<EditorEnvironment["metadata"]>): void;

    /** Export to server format (for persistence) */
    exportToServer(): ServerEnvironmentPayload;

    /** Clear all blocks */
    clear(): void;
}

const EditorEnvironmentContext = createContext<EditorEnvironmentContextValue | null>(null);

interface Props {
    children: React.ReactNode;
    /** Initial environment state */
    initialEnvironment?: EditorEnvironment;
    /** Organization ID (required if no initial environment) */
    organisationId?: string;
}

/**
 * Default layout for new blocks
 */
const DEFAULT_LAYOUT: EditorLayoutRect = {
    x: 0,
    y: 0,
    w: 12,
    h: 8,
};

/**
 * Provider that manages the editor environment state
 */
export const EditorEnvironmentProvider: React.FC<Props> = ({
    children,
    initialEnvironment,
    organisationId,
}) => {
    const editorLayout = useEditorLayout();

    // Initialize environment
    const [environment, setEnvironment] = useState<EditorEnvironment>(() => {
        if (initialEnvironment) return initialEnvironment;

        if (!organisationId) {
            throw new Error(
                "EditorEnvironmentProvider requires either initialEnvironment or organisationId"
            );
        }

        return {
            id: BlockTreeBuilder.generateId("env"),
            organisationId,
            blocks: [],
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    });

    console.log(environment);

    /**
     * Calculate next available layout position
     */
    const getNextLayout = useCallback((): EditorLayoutRect => {
        if (environment.blocks.length === 0) {
            return { ...DEFAULT_LAYOUT };
        }

        // Find the bottom-most block
        const maxY = environment.blocks.reduce((max, block) => {
            const bottom = block.layout.y + block.layout.h;
            return Math.max(max, bottom);
        }, 0);

        return {
            x: 0,
            y: maxY + 1, // Add some spacing
            w: 12,
            h: 8,
        };
    }, [environment.blocks]);

    /**
     * Add a new top-level block
     */
    const addBlock = useCallback(
        (tree: BlockTree, layout?: EditorLayoutRect): string => {
            console.log("Hey");
            const blockId = tree.root.block.id;
            const finalLayout = layout ?? getNextLayout();

            const newInstance: EditorBlockInstance = {
                tree,
                layout: finalLayout,
            };

            setEnvironment((prev) => ({
                ...prev,
                blocks: [...prev.blocks, newInstance],
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            }));

            // Update the layout tracker
            editorLayout.updateHierarchy([{ blockId, parentId: null }]);
            console.log(editorLayout.hierarchy)
            return blockId;
        },
        [getNextLayout, editorLayout]
    );

    /**
     * Remove a block and its descendants
     */
    const removeBlock = useCallback(
        (blockId: string): void => {
            // Get descendants from layout provider
            const descendants = editorLayout.getDescendants(blockId);
            const allIdsToRemove = new Set([blockId, ...descendants]);

            setEnvironment((prev) => ({
                ...prev,
                blocks: prev.blocks.filter(
                    (block) => !allIdsToRemove.has(block.tree.root.block.id)
                ),
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            }));

            // Update the layout tracker
            editorLayout.removeBlock(blockId);
        },
        [editorLayout]
    );

    /**
     * Update a block's tree
     */
    const updateBlock = useCallback((blockId: string, tree: BlockTree): void => {
        setEnvironment((prev) => ({
            ...prev,
            blocks: prev.blocks.map((block) =>
                block.tree.root.block.id === blockId ? { ...block, tree } : block
            ),
            metadata: {
                ...prev.metadata,
                updatedAt: new Date().toISOString(),
            },
        }));
    }, []);

    /**
     * Update a block's layout position
     */
    const updateLayout = useCallback((blockId: string, layout: EditorLayoutRect): void => {
        setEnvironment((prev) => ({
            ...prev,
            blocks: prev.blocks.map((block) =>
                block.tree.root.block.id === blockId ? { ...block, layout } : block
            ),
            metadata: {
                ...prev.metadata,
                updatedAt: new Date().toISOString(),
            },
        }));
    }, []);

    /**
     * Get a specific block by ID
     */
    const getBlock = useCallback(
        (blockId: string): EditorBlockInstance | undefined => {
            return environment.blocks.find((block) => block.tree.root.block.id === blockId);
        },
        [environment.blocks]
    );

    /**
     * Get all blocks
     */
    const getAllBlocks = useCallback((): EditorBlockInstance[] => {
        return environment.blocks;
    }, [environment.blocks]);

    /**
     * Insert a nested block into a parent's slot
     */
    const insertNestedBlock = useCallback(
        ({ parentId, slotName, childTree, position }: InsertNestedBlockOptions): void => {
            const parentBlock = getBlock(parentId);
            if (!parentBlock) {
                console.error(`Parent block ${parentId} not found`);
                return;
            }

            // Add child to parent's slot
            const updatedTree = BlockTreeBuilder.addChildToSlot(
                parentBlock.tree,
                slotName,
                childTree,
                position
            );

            updateBlock(parentId, updatedTree);

            // IMPORTANT: Also add the child as a top-level block instance
            // so that getBlock() can find it. The hierarchy tracker will
            // handle parent-child relationships.
            const childInstance: EditorBlockInstance = {
                tree: childTree,
                layout: { x: 0, y: 0, w: 12, h: 4 }, // Default nested layout
            };

            setEnvironment((prev) => ({
                ...prev,
                blocks: [...prev.blocks, childInstance],
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            }));

            // Update layout hierarchy
            editorLayout.updateHierarchy([
                { blockId: childTree.root.block.id, parentId: parentId },
            ]);
        },
        [getBlock, updateBlock, editorLayout]
    );

    /**
     * Create a new block from options
     */
    const createBlock = useCallback(
        ({ typeKey, initialData, layout, uiMetadata }: CreateBlockOptions): string => {
            // For now, create a minimal BlockTree
            // In production, you'd fetch the BlockType from an API
            const tree = BlockTreeBuilder.createMinimal(
                typeKey,
                environment.organisationId,
                initialData
            );

            const instance: EditorBlockInstance = {
                tree,
                layout: layout ?? getNextLayout(),
                uiMetadata,
            };

            const blockId = tree.root.block.id;

            setEnvironment((prev) => ({
                ...prev,
                blocks: [...prev.blocks, instance],
                metadata: {
                    ...prev.metadata,
                    updatedAt: new Date().toISOString(),
                },
            }));

            editorLayout.updateHierarchy([{ blockId, parentId: null }]);

            return blockId;
        },
        [environment.organisationId, getNextLayout, editorLayout]
    );

    /**
     * Duplicate an existing block
     */
    const duplicateBlock = useCallback(
        (blockId: string): string | undefined => {
            const original = getBlock(blockId);
            if (!original) return undefined;

            // Clone the tree and generate new IDs
            const clonedTree = BlockTreeBuilder.cloneTree(original.tree);
            clonedTree.root.block.id = BlockTreeBuilder.generateId("block");

            // Place below the original
            const newLayout: EditorLayoutRect = {
                x: original.layout.x,
                y: original.layout.y + original.layout.h + 1,
                w: original.layout.w,
                h: original.layout.h,
            };

            return addBlock(clonedTree, newLayout);
        },
        [getBlock, addBlock]
    );

    /**
     * Update environment metadata
     */
    const updateMetadata = useCallback((metadata: Partial<EditorEnvironment["metadata"]>): void => {
        setEnvironment((prev) => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                ...metadata,
                updatedAt: new Date().toISOString(),
            },
        }));
    }, []);

    /**
     * Export to server format
     */
    const exportToServer = useCallback((): ServerEnvironmentPayload => {
        return {
            id: environment.id,
            organisationId: environment.organisationId,
            layout: environment.blocks.map((block) => ({
                blockId: block.tree.root.block.id,
                position: block.layout,
            })),
            metadata: environment.metadata,
        };
    }, [environment]);

    /**
     * Clear all blocks
     */
    const clear = useCallback((): void => {
        setEnvironment((prev) => ({
            ...prev,
            blocks: [],
            metadata: {
                ...prev.metadata,
                updatedAt: new Date().toISOString(),
            },
        }));
    }, []);

    const value = useMemo<EditorEnvironmentContextValue>(
        () => ({
            environment,
            addBlock,
            removeBlock,
            updateBlock,
            updateLayout,
            getBlock,
            getAllBlocks,
            insertNestedBlock,
            createBlock,
            duplicateBlock,
            updateMetadata,
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
            insertNestedBlock,
            createBlock,
            duplicateBlock,
            updateMetadata,
            exportToServer,
            clear,
        ]
    );

    return (
        <EditorEnvironmentContext.Provider value={value}>
            {children}
        </EditorEnvironmentContext.Provider>
    );
};

/**
 * Hook to access the editor environment context
 */
export function useEditorEnvironment(): EditorEnvironmentContextValue {
    const context = useContext(EditorEnvironmentContext);
    if (!context) {
        throw new Error("useEditorEnvironment must be used within an EditorEnvironmentProvider");
    }
    return context;
}
