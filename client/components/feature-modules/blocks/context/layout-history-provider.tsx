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
import { LayoutSnapshot, StructuralOperationRecord } from "../interface/command.interface";

interface LayoutHistoryContextValue {
    /** Track that a non-structural layout change occurred (resize, reposition). */
    markLayoutChange: () => void;

    /** Track that a structural change occurred (add, remove, move blocks). */
    markStructuralChange: () => void;

    /** Reset all tracked change counters (typically after a successful save or discard). */
    clearHistory: () => void;

    /** Whether there are pending layout changes. */
    hasUnsavedChanges: boolean;

    /** Optional count of tracked layout changes for UI feedback. */
    layoutChangeCount: number;

    /** Optional count of tracked structural changes for UI feedback. */
    structuralChangeCount: number;

    /** Store the snapshot that represents the last persisted state. */
    setBaselineSnapshot: (snapshot: LayoutSnapshot) => void;

    /** Retrieve the last persisted snapshot if it exists. */
    getBaselineSnapshot: () => LayoutSnapshot | null;

    /** Record a structural operation in the audit trail */
    recordStructuralOperation: (operation: StructuralOperationRecord) => void;

    /** Get all structural operations since last save */
    getStructuralOperations: () => StructuralOperationRecord[];

    /** Clear structural operations (after successful save) */
    clearStructuralOperations: () => void;
}

const LayoutHistoryContext = createContext<LayoutHistoryContextValue | undefined>(undefined);

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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const baselineSnapshotRef = useRef<LayoutSnapshot | null>(null);
    const structuralOperationsRef = useRef<StructuralOperationRecord[]>([]);

    const markLayoutChange = useCallback(() => {
        setLayoutChangeCount((prev) => prev + 1);
        setHasUnsavedChanges(true);
    }, []);

    const markStructuralChange = useCallback(() => {
        setStructuralChangeCount((prev) => prev + 1);
        setHasUnsavedChanges(true);
    }, []);

    const recordStructuralOperation = useCallback((operation: StructuralOperationRecord) => {
        structuralOperationsRef.current.push(operation);
    }, []);

    const getStructuralOperations = useCallback(() => {
        return [...structuralOperationsRef.current];
    }, []);

    const clearStructuralOperations = useCallback(() => {
        structuralOperationsRef.current = [];
    }, []);

    const clearHistory = useCallback(() => {
        setLayoutChangeCount(0);
        setStructuralChangeCount(0);
        setHasUnsavedChanges(false);
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
            clearHistory,
            hasUnsavedChanges,
            layoutChangeCount,
            structuralChangeCount,
            setBaselineSnapshot,
            getBaselineSnapshot,
            recordStructuralOperation,
            getStructuralOperations,
            clearStructuralOperations,
        }),
        [
            markLayoutChange,
            markStructuralChange,
            clearHistory,
            hasUnsavedChanges,
            layoutChangeCount,
            structuralChangeCount,
            setBaselineSnapshot,
            getBaselineSnapshot,
            recordStructuralOperation,
            getStructuralOperations,
            clearStructuralOperations,
        ]
    );

    return <LayoutHistoryContext.Provider value={value}>{children}</LayoutHistoryContext.Provider>;
};
