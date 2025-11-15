"use client";

import React, { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { BlockNode } from "../interface/block.interface";
import { useBlockEnvironment } from "./block-environment-provider";
import { useGrid } from "./grid-provider";
import { useLayoutChange } from "./layout-change-provider";

/**
 * Extended context that provides command-enabled operations
 * This wraps the base BlockEnvironment operations with command pattern
 */
interface CommandEnabledEnvironmentContextValue {
    /** Change-aware operations that will mark the layout as dirty */
    addBlockWithCommand: (
        block: BlockNode,
        parentId?: string | null,
        index?: number | null
    ) => string;
    removeBlockWithCommand: (blockId: string) => void;
    moveBlockWithCommand: (blockId: string, targetParentId: string | null) => void;
    updateBlockWithCommand: (blockId: string, updatedContent: BlockNode) => void;

    /** Direct access to underlying providers (for when commands aren't needed) */
    blockEnvironment: ReturnType<typeof useBlockEnvironment>;
    gridStack: ReturnType<typeof useGrid>;
}

const CommandEnabledEnvironmentContext =
    createContext<CommandEnabledEnvironmentContextValue | undefined>(undefined);

export const useCommandEnvironment = (): CommandEnabledEnvironmentContextValue => {
    const context = useContext(CommandEnabledEnvironmentContext);
    if (!context) {
        throw new Error(
            "useCommandEnvironment must be used within a CommandEnabledEnvironmentProvider"
        );
    }
    return context;
};

/**
 * Provider that wraps BlockEnvironment operations with command pattern
 * This sits between the UI and the base providers, intercepting operations
 * and converting them to commands for undo/redo support
 */
export const CommandEnabledEnvironmentProvider: FC<PropsWithChildren> = ({ children }) => {
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
    const addBlockWithCommand = useCallback(
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
    const removeBlockWithCommand = useCallback(
        (blockId: string): void => {
            removeBlock(blockId);
            trackStructuralChange();
        },
        [removeBlock, trackStructuralChange]
    );

    /**
     * Move a block using a command
     */
    const moveBlockWithCommand = useCallback(
        (blockId: string, targetParentId: string | null): void => {
            moveBlock(blockId, targetParentId);
            trackStructuralChange();
        },
        [moveBlock, trackStructuralChange]
    );

    /**
     * Update a block using a command
     */
    const updateBlockWithCommand = useCallback(
        (blockId: string, updatedContent: BlockNode): void => {
            updateBlock(blockId, updatedContent);
            trackStructuralChange();
        },
        [updateBlock, trackStructuralChange]
    );

    const value: CommandEnabledEnvironmentContextValue = useMemo(
        () => ({
            addBlockWithCommand,
            removeBlockWithCommand,
            moveBlockWithCommand,
            updateBlockWithCommand,
            blockEnvironment,
            gridStack,
        }),
        [
            addBlockWithCommand,
            removeBlockWithCommand,
            moveBlockWithCommand,
            updateBlockWithCommand,
            blockEnvironment,
            gridStack,
        ]
    );

    return (
        <CommandEnabledEnvironmentContext.Provider value={value}>
            {children}
        </CommandEnabledEnvironmentContext.Provider>
    );
};
