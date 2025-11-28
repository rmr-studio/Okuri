"use client";

import {
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import { LayoutSnapshot, StructuralOperationRequest } from "../interface/command.interface";

interface LayoutHistoryContextValue {
    /** Track that a non-structural layout change occurred (resize, reposition). */
    markLayoutChange: () => void;

    /** Track that a structural change occurred (add, remove, move blocks). */
    markStructuralChange: () => void;

    /** Track that a content change occurred (update block payload). */
    markContentChange: () => void;

    /** Reset all tracked change counters (typically after a successful save or discard). */
    clearHistory: () => void;

    /** Whether there are pending layout changes. */
    hasUnsavedChanges: boolean;

    /** Whether there are pending layout/structural changes (not content). */
    hasLayoutChanges: boolean;

    /** Whether there are pending content changes. */
    hasContentChanges: boolean;

    /** Optional count of tracked layout changes for UI feedback. */
    layoutChangeCount: number;

    /** Optional count of tracked structural changes for UI feedback. */
    structuralChangeCount: number;

    /** Optional count of tracked content changes for UI feedback. */
    contentChangeCount: number;

    /** Store the snapshot that represents the last persisted state. */
    setBaselineSnapshot: (snapshot: LayoutSnapshot) => void;

    /** Retrieve the last persisted snapshot if it exists. */
    getBaselineSnapshot: () => LayoutSnapshot | null;

    /** Record a structural operation in the audit trail */
    recordStructuralOperation: (operation: StructuralOperationRequest) => void;

    /** Get all structural operations since last save */
    getStructuralOperations: () => StructuralOperationRequest[];

    /** Clear structural operations (after successful save) */
    clearStructuralOperations: () => void;
}

const LayoutHistoryContext = createContext<LayoutHistoryContextValue | undefined>(undefined);

/**
 * Checks if a block ID represents a placeholder block.
 * Placeholder blocks have IDs ending with '-placeholder' and are used to keep subgrids active.
 */
function isPlaceholderId(id: string | undefined): boolean {
    return id?.endsWith("-placeholder") ?? false;
}

/**
 * Checks if a structural operation involves any placeholder blocks.
 * Placeholder operations should not be sent to the backend as they're not real blocks.
 */
function isPlaceholderOperation(operation: StructuralOperationRequest): boolean {
    const { data } = operation;

    // Check the main blockId
    if ("blockId" in data && isPlaceholderId(data.blockId)) {
        return true;
    }

    // Check parent IDs (parentId, fromParentId, toParentId)
    if ("parentId" in data && isPlaceholderId(data.parentId)) {
        return true;
    }
    if ("fromParentId" in data && isPlaceholderId(data.fromParentId)) {
        return true;
    }
    if ("toParentId" in data && isPlaceholderId(data.toParentId)) {
        return true;
    }

    // Check childrenIds array (for REMOVE_BLOCK operations)
    if ("childrenIds" in data && Array.isArray(data.childrenIds)) {
        if (data.childrenIds.some((childId) => isPlaceholderId(childId))) {
            return true;
        }
    }

    return false;
}

export const useLayoutHistory = (): LayoutHistoryContextValue => {
    const context = useContext(LayoutHistoryContext);
    if (!context) {
        throw new Error("useLayoutHistory must be used within a LayoutHistoryProvider");
    }
    return context;
};

export const LayoutHistoryProvider: FC<PropsWithChildren> = ({ children }) => {
    const [layoutChangeCount, setLayoutChangeCount] = useState(0);
    const [structuralChangeCount, setStructuralChangeCount] = useState(0);
    const [contentChangeCount, setContentChangeCount] = useState(0);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [hasLayoutChanges, setHasLayoutChanges] = useState(false);
    const [hasContentChanges, setHasContentChanges] = useState(false);

    const baselineSnapshotRef = useRef<LayoutSnapshot | null>(null);
    const structuralOperationsRef = useRef<StructuralOperationRequest[]>([]);

    const markLayoutChange = useCallback(() => {
        setLayoutChangeCount((prev) => prev + 1);
        setHasUnsavedChanges(true);
        setHasLayoutChanges(true);
    }, []);

    const markStructuralChange = useCallback(() => {
        setStructuralChangeCount((prev) => prev + 1);
        setHasUnsavedChanges(true);
        setHasLayoutChanges(true);
    }, []);

    const markContentChange = useCallback(() => {
        setContentChangeCount((prev) => prev + 1);
        setHasUnsavedChanges(true);
        setHasContentChanges(true);
    }, []);

    const recordStructuralOperation = useCallback((operation: StructuralOperationRequest) => {
        structuralOperationsRef.current.push(operation);
    }, []);

    const getStructuralOperations = useCallback(() => {
        // Filter out operations involving placeholder blocks (they're not real blocks)
        return structuralOperationsRef.current.filter((operation) => {
            return !isPlaceholderOperation(operation);
        });
    }, []);

    const clearStructuralOperations = useCallback(() => {
        structuralOperationsRef.current = [];
    }, []);

    const clearHistory = useCallback(() => {
        setLayoutChangeCount(0);
        setStructuralChangeCount(0);
        setContentChangeCount(0);
        setHasUnsavedChanges(false);
        setHasLayoutChanges(false);
        setHasContentChanges(false);
        clearStructuralOperations();
    }, [clearStructuralOperations]);

    const setBaselineSnapshot = useCallback((snapshot: LayoutSnapshot) => {
        baselineSnapshotRef.current = snapshot;
    }, []);

    const getBaselineSnapshot = useCallback(() => baselineSnapshotRef.current, []);

    const value: LayoutHistoryContextValue = useMemo(
        () => ({
            markLayoutChange,
            markStructuralChange,
            markContentChange,
            clearHistory,
            hasUnsavedChanges,
            hasLayoutChanges,
            hasContentChanges,
            layoutChangeCount,
            structuralChangeCount,
            contentChangeCount,
            setBaselineSnapshot,
            getBaselineSnapshot,
            recordStructuralOperation,
            getStructuralOperations,
            clearStructuralOperations,
        }),
        [
            markLayoutChange,
            markStructuralChange,
            markContentChange,
            clearHistory,
            hasUnsavedChanges,
            hasLayoutChanges,
            hasContentChanges,
            layoutChangeCount,
            structuralChangeCount,
            contentChangeCount,
            setBaselineSnapshot,
            getBaselineSnapshot,
            recordStructuralOperation,
            getStructuralOperations,
            clearStructuralOperations,
        ]
    );

    return <LayoutHistoryContext.Provider value={value}>{children}</LayoutHistoryContext.Provider>;
};
