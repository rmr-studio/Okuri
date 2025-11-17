"use client";

import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { BlockNode } from "../interface/block.interface";
import {
    LayoutCommandType,
    StructuralOperationRecord,
    AddBlockOperation,
    RemoveBlockOperation,
    MoveBlockOperation,
    UpdateBlockOperation,
} from "../interface/command.interface";
import { useBlockEnvironment } from "./block-environment-provider";
import { useGrid } from "./grid-provider";
import { useLayoutChange } from "./layout-change-provider";
import { useLayoutHistory } from "./layout-history-provider";

interface TrackedEnvironmentContextValue {
    /** Change-aware operations that will mark the layout as dirty */
    addTrackedBlock: (block: BlockNode, parentId?: string | null, index?: number | null) => string;
    removeTrackedBlock: (blockId: string) => void;
    moveTrackedBlock: (blockId: string, targetParentId: string | null) => void;
    updateTrackedBlock: (blockId: string, updatedContent: BlockNode) => void;

    /** Direct access to underlying providers (for when commands aren't needed) */
    blockEnvironment: ReturnType<typeof useBlockEnvironment>;
    gridStack: ReturnType<typeof useGrid>;
}

const TrackedEnvironmentContext = createContext<TrackedEnvironmentContextValue | undefined>(
    undefined
);

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
    const { recordStructuralOperation } = useLayoutHistory();

    const addBlock = blockEnvironment.addBlock;
    const removeBlock = blockEnvironment.removeBlock;
    const moveBlock = blockEnvironment.moveBlock;
    const updateBlock = blockEnvironment.updateBlock;
    const getParentId = blockEnvironment.getParentId;

    /**
     * Add a block using a command
     * This creates an AddBlockCommand, executes it, and adds it to history
     */
    const addTrackedBlock = useCallback(
        (block: BlockNode, parentId: string | null = null, index?: number | null): string => {
            const id = addBlock(block, parentId, index);

            // Record the operation
            const operation: StructuralOperationRecord = {
                id: crypto.randomUUID(),
                type: LayoutCommandType.ADD_BLOCK,
                timestamp: Date.now(),
                data: {
                    type: "ADD_BLOCK",
                    blockId: id,
                    block,
                    parentId,
                    index,
                } as AddBlockOperation,
            };
            recordStructuralOperation(operation);

            trackStructuralChange();
            return id;
        },
        [addBlock, trackStructuralChange, recordStructuralOperation]
    );

    /**
     * Remove a block using a command
     */
    const removeTrackedBlock = useCallback(
        (blockId: string): void => {
            const previousParentId = getParentId(blockId);
            removeBlock(blockId);

            // Record the operation
            const operation: StructuralOperationRecord = {
                id: crypto.randomUUID(),
                type: LayoutCommandType.REMOVE_BLOCK,
                timestamp: Date.now(),
                data: {
                    type: "REMOVE_BLOCK",
                    blockId,
                    previousParentId,
                } as RemoveBlockOperation,
            };
            recordStructuralOperation(operation);

            trackStructuralChange();
        },
        [removeBlock, trackStructuralChange, recordStructuralOperation, getParentId]
    );

    /**
     * Move a block using a command
     */
    const moveTrackedBlock = useCallback(
        (blockId: string, targetParentId: string | null): void => {
            const fromParentId = getParentId(blockId);
            moveBlock(blockId, targetParentId);

            // Record the operation
            const operation: StructuralOperationRecord = {
                id: crypto.randomUUID(),
                type: LayoutCommandType.MOVE_BLOCK,
                timestamp: Date.now(),
                data: {
                    type: "MOVE_BLOCK",
                    blockId,
                    fromParentId,
                    toParentId: targetParentId,
                } as MoveBlockOperation,
            };
            recordStructuralOperation(operation);

            trackStructuralChange();
        },
        [moveBlock, trackStructuralChange, recordStructuralOperation, getParentId]
    );

    /**
     * Update a block using a command
     */
    const updateTrackedBlock = useCallback(
        (blockId: string, updatedContent: BlockNode): void => {
            updateBlock(blockId, updatedContent);

            // Record the operation
            const operation: StructuralOperationRecord = {
                id: crypto.randomUUID(),
                type: LayoutCommandType.UPDATE_BLOCK,
                timestamp: Date.now(),
                data: {
                    type: "UPDATE_BLOCK",
                    blockId,
                    updatedContent,
                } as UpdateBlockOperation,
            };
            recordStructuralOperation(operation);

            trackStructuralChange();
        },
        [updateBlock, trackStructuralChange, recordStructuralOperation]
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
