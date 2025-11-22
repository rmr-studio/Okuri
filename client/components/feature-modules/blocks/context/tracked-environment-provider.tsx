"use client";

import { now } from "@/lib/util/utils";
import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { BlockNode } from "../interface/block.interface";
import { StructuralOperationRequest } from "../interface/command.interface";
import { useBlockEnvironment } from "./block-environment-provider";
import { useGrid } from "./grid-provider";
import { useLayoutChange } from "./layout-change-provider";
import { useLayoutHistory } from "./layout-history-provider";
import { useBlockDeletionGuard } from "../hooks/use-block-deletion-guard";

interface TrackedEnvironmentContextValue {
    /** Change-aware operations that will mark the layout as dirty */
    addTrackedBlock: (block: BlockNode, parentId?: string | null, index?: number | null) => string;
    removeTrackedBlock: (blockId: string) => void;
    moveTrackedBlock: (blockId: string, targetParentId: string | null) => void;
    updateTrackedBlock: (blockId: string, updatedContent: BlockNode) => void;
    reorderTrackedBlock: (blockId: string, parentId: string, targetIndex: number) => void;

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
    const {
        addBlock,
        removeBlock,
        moveBlock,
        updateBlock,
        reorderBlock,
        getChildren,
        getParentId,
        getDescendants,
    } = blockEnvironment;
    const gridStack = useGrid();
    const { trackStructuralChange } = useLayoutChange();
    const { recordStructuralOperation } = useLayoutHistory();
    const { canDeleteBlock } = useBlockDeletionGuard();

    /**
     * Add a block using a command
     * This creates an AddBlockCommand, executes it, and adds it to history
     */
    // TODO: Need to support List block index insertion (different method)
    const addTrackedBlock = useCallback(
        (block: BlockNode, parentId: string | null = null, index?: number | null): string => {
            const id = addBlock(block, parentId);

            // Record the operation
            const operation: StructuralOperationRequest = {
                id: crypto.randomUUID(),
                timestamp: now(),
                data: {
                    type: "ADD_BLOCK",
                    blockId: id,
                    block,
                    parentId: parentId || undefined,
                    // Non falsey check to avoid 0 mishap
                    index: index !== undefined && index !== null ? index : undefined,
                },
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
            // Check deletion guard before proceeding
            if (!canDeleteBlock(blockId)) {
                return; // Block is protected, abort deletion
            }

            const previousParentId = getParentId(blockId) || undefined;
            const children = getDescendants(blockId);
            removeBlock(blockId);

            // Record the operation
            const operation: StructuralOperationRequest = {
                id: crypto.randomUUID(),
                timestamp: now(),
                data: {
                    type: "REMOVE_BLOCK",
                    childrenIds: children,
                    blockId,
                    parentId: previousParentId,
                },
            };
            recordStructuralOperation(operation);

            trackStructuralChange();
        },
        [removeBlock, trackStructuralChange, recordStructuralOperation, getParentId, getDescendants, canDeleteBlock]
    );

    /**
     * Move a block using a command
     */
    const moveTrackedBlock = useCallback(
        (blockId: string, targetParentId: string | null): void => {
            const fromParentId = getParentId(blockId) || undefined;
            moveBlock(blockId, targetParentId);

            // Record the operation
            const operation: StructuralOperationRequest = {
                id: crypto.randomUUID(),
                timestamp: now(),
                data: {
                    type: "MOVE_BLOCK",
                    blockId,
                    fromParentId,
                    toParentId: targetParentId || undefined,
                },
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
            const operation: StructuralOperationRequest = {
                id: crypto.randomUUID(),
                timestamp: now(),
                data: {
                    type: "UPDATE_BLOCK",
                    blockId,
                    updatedContent,
                },
            };
            recordStructuralOperation(operation);

            trackStructuralChange();
        },
        [updateBlock, trackStructuralChange, recordStructuralOperation]
    );

    /**
     * Reorder a block within its parent (for list items)
     * This changes the orderIndex without changing the parent
     */
    const reorderTrackedBlock = useCallback(
        (blockId: string, parentId: string, targetIndex: number): void => {
            // Get current index before reordering
            const children = getChildren(parentId);
            const fromIndex = children.findIndex((childId) => childId === blockId);

            if (fromIndex === -1) {
                console.warn(`Block ${blockId} not found in parent ${parentId}`);
                return;
            }
            if (targetIndex < 0 || targetIndex >= children.length) {
                console.warn(`Target index ${targetIndex} is out of bounds for parent ${parentId}`);
                return;
            }

            // Only proceed if the index actually changed
            if (fromIndex === targetIndex) {
                return;
            }

            // Perform the reorder
            reorderBlock(blockId, parentId, targetIndex);

            // Record the operation
            const operation: StructuralOperationRequest = {
                id: crypto.randomUUID(),
                timestamp: now(),
                data: {
                    type: "REORDER_BLOCK",
                    blockId,
                    parentId,
                    fromIndex,
                    toIndex: targetIndex,
                },
            };
            recordStructuralOperation(operation);

            trackStructuralChange();
        },
        [reorderBlock, trackStructuralChange, recordStructuralOperation, getChildren]
    );

    const value: TrackedEnvironmentContextValue = useMemo(
        () => ({
            addTrackedBlock,
            removeTrackedBlock,
            moveTrackedBlock,
            updateTrackedBlock,
            reorderTrackedBlock,
            blockEnvironment,
            gridStack,
        }),
        [
            addTrackedBlock,
            removeTrackedBlock,
            moveTrackedBlock,
            updateTrackedBlock,
            reorderTrackedBlock,
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
