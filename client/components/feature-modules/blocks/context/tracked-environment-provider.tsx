"use client";

import React, { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { BlockNode } from "../interface/block.interface";
import { useBlockEnvironment } from "./block-environment-provider";
import { useGrid } from "./grid-provider";
import { useLayoutChange } from "./layout-change-provider";

interface TrackedEnvironmentContextValue {
    /** Change-aware operations that will mark the layout as dirty */
    addTrackedBlock: (
        block: BlockNode,
        parentId?: string | null,
        index?: number | null
    ) => string;
    removeTrackedBlock: (blockId: string) => void;
    moveTrackedBlock: (blockId: string, targetParentId: string | null) => void;
    updateTrackedBlock: (blockId: string, updatedContent: BlockNode) => void;

    /** Direct access to underlying providers (for when commands aren't needed) */
    blockEnvironment: ReturnType<typeof useBlockEnvironment>;
    gridStack: ReturnType<typeof useGrid>;
}

const TrackedEnvironmentContext =
    createContext<TrackedEnvironmentContextValue | undefined>(undefined);

export const useTrackedEnvironment = (): TrackedEnvironmentContextValue => {
    const context = useContext(TrackedEnvironmentContext);
    if (!context) {
        throw new Error("useTrackedEnvironment must be used within a TrackedEnvironmentProvider");
    }
    return context;
};

/**
 * Provider that wraps BlockEnvironment operations with command pattern
 * This sits between the UI and the base providers, intercepting operations
 * and converting them to commands for undo/redo support
 */
export const TrackedEnvironmentProvider: FC<PropsWithChildren> = ({ children }) => {
    const blockEnvironment = useBlockEnvironment();
    const gridStack = useGrid();
    const { trackStructuralChange } = useLayoutChange();

    const addBlock = blockEnvironment.addBlock;
    const removeBlock = blockEnvironment.removeBlock;
    const moveBlock = blockEnvironment.moveBlock;
    const updateBlock = blockEnvironment.updateBlock;

    /**
     * Add a block using a command
     * This creates an AddBlockCommand, executes it, and adds it to history
     */
    const addTrackedBlock = useCallback(
        (block: BlockNode, parentId: string | null = null, index: number | null = null): string => {
            const id = addBlock(block, parentId ?? null, index ?? null);
            trackStructuralChange();
            return id;
        },
        [addBlock, trackStructuralChange]
    );

    /**
     * Remove a block using a command
     */
    const removeTrackedBlock = useCallback(
        (blockId: string): void => {
            removeBlock(blockId);
            trackStructuralChange();
        },
        [removeBlock, trackStructuralChange]
    );

    /**
     * Move a block using a command
     */
    const moveTrackedBlock = useCallback(
        (blockId: string, targetParentId: string | null): void => {
            moveBlock(blockId, targetParentId);
            trackStructuralChange();
        },
        [moveBlock, trackStructuralChange]
    );

    /**
     * Update a block using a command
     */
    const updateTrackedBlock = useCallback(
        (blockId: string, updatedContent: BlockNode): void => {
            updateBlock(blockId, updatedContent);
            trackStructuralChange();
        },
        [updateBlock, trackStructuralChange]
    );

    const value: TrackedEnvironmentContextValue = useMemo(
        () => ({
            addTrackedBlock,
            removeTrackedBlock,
            moveTrackedBlock,
            updateTrackedBlock,
            blockEnvironment,
            gridStack,
        }),
        [
            addTrackedBlock,
            removeTrackedBlock,
            moveTrackedBlock,
            updateTrackedBlock,
            blockEnvironment,
            gridStack,
        ]
    );

    return (
        <TrackedEnvironmentContext.Provider value={value}>
            {children}
        </TrackedEnvironmentContext.Provider>
    );
};
