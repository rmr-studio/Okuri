"use client";

import { GridStackOptions } from "gridstack";
import {
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    LayoutSnapshot,
    SaveLayoutResponse,
    StructuralOperationRecord,
} from "../interface/command.interface";
import { cloneEnvironment } from "../util/environment/environment.util";
import { useBlockEnvironment } from "./block-environment-provider";
import { useGrid } from "./grid-provider";
import { useLayoutHistory } from "./layout-history-provider";

// DONT RESET THE LOCAL VERSION BACK TO ZERO IN ANY SITUATION

interface LayoutChangeContextValue {
    /** Check if there are unsaved layout changes */
    hasLayoutChanges: () => boolean;

    /** Track that a layout change occurred */
    trackLayoutChange: () => void;

    /** Track that a structural change occurred (re-parent, add, remove) */
    trackStructuralChange: () => void;

    /** Clear all tracked changes */
    clearLayoutChanges: () => void;

    /** Save layout changes to backend with version control */
    saveLayoutChanges: () => Promise<boolean>;

    /** Discard layout changes and reload from last saved state */
    discardLayoutChanges: () => void;

    /** Check if discard is allowed (always true with command system) */
    canDiscard: () => boolean;

    /** Number of layout change events (for UI feedback) */
    layoutChangeCount: number;

    /** Version synced with backend (published) */
    publishedVersion: number;

    /** Local-only version used for forcing re-renders on client-side resets */
    localVersion: number;

    /** Save status for UI feedback */
    saveStatus: "idle" | "saving" | "success" | "error" | "conflict";

    /** Conflict data if save failed due to version mismatch */
    conflictData: SaveLayoutResponse | null;

    /** Resolve a conflict after user decision */
    resolveConflict: (action: "keep-mine" | "use-theirs" | "cancel") => Promise<boolean>;
}

const LayoutChangeContext = createContext<LayoutChangeContextValue | undefined>(undefined);

export const useLayoutChange = (): LayoutChangeContextValue => {
    const context = useContext(LayoutChangeContext);
    if (!context) {
        throw new Error("useLayoutChange must be used within a LayoutChangeProvider");
    }
    return context;
};

export const LayoutChangeProvider: FC<PropsWithChildren> = ({ children }) => {
    const {
        layoutId,
        blockTreeLayout,
        isInitialized,
        environment,
        hydrateEnvironment,
        getEnvironmentSnapshot,
    } = useBlockEnvironment();
    const { gridStack, save: saveGridLayout, reloadEnvironment } = useGrid();
    const {
        markLayoutChange: markHistoryLayoutChange,
        markStructuralChange: markHistoryStructuralChange,
        clearHistory,
        hasUnsavedChanges,
        setBaselineSnapshot,
        getBaselineSnapshot,
        getStructuralOperations,
        clearStructuralOperations,
    } = useLayoutHistory();

    const [publishedVersion, setPublishedVersion] = useState(blockTreeLayout?.version ?? 0);
    const [localVersion, setLocalVersion] = useState(0);
    const [changeCount, setChangeCount] = useState(0);
    const [saveStatus, setSaveStatus] = useState<
        "idle" | "saving" | "success" | "error" | "conflict"
    >("idle");
    const [conflictData, setConflictData] = useState<SaveLayoutResponse | null>(null);

    const updatePublishedVersion = useCallback(
        (nextVersion: number) => {
            setPublishedVersion(nextVersion);
        },
        [setPublishedVersion]
    );

    const applySnapshot = useCallback(
        (snapshot: LayoutSnapshot) => {
            if (!gridStack) return;
            const savedChildren = snapshot.gridLayout.children ?? [];

            // Re-hydrate environment, so that all blocks are present/restored before loading layout
            requestAnimationFrame(() => {
                hydrateEnvironment(snapshot.blockEnvironment);
            });

            setLocalVersion((version) => version + 1);
            requestAnimationFrame(() => {
                gridStack.load(savedChildren);
                reloadEnvironment(snapshot.gridLayout);
            });
        },
        [gridStack, reloadEnvironment, hydrateEnvironment]
    );

    // Flag to prevent tracking during discard/initialization
    const isDiscardingRef = useRef(false);
    const hasInitializedRef = useRef(false);

    // Capture initial snapshot when a layout is provided from the server
    useEffect(() => {
        if (!blockTreeLayout?.layout) return;

        const snapshot: LayoutSnapshot = {
            blockEnvironment: getEnvironmentSnapshot(),
            gridLayout: structuredClone(blockTreeLayout.layout),
            timestamp: Date.now(),
            version: blockTreeLayout.version ?? 0,
        };

        setBaselineSnapshot(snapshot);
        updatePublishedVersion(blockTreeLayout.version ?? 0);
    }, [
        blockTreeLayout?.layout,
        blockTreeLayout?.version,
        getEnvironmentSnapshot,
        setBaselineSnapshot,
        updatePublishedVersion,
    ]);

    // Mark as initialized once BlockEnvironment is ready
    // Add a small delay to ensure all widgets finish syncing
    useEffect(() => {
        if (isInitialized && !hasInitializedRef.current) {
            // Wait 200ms after initialization to ensure widget sync completes
            const timer = setTimeout(() => {
                hasInitializedRef.current = true;
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [isInitialized]);

    /**
     * Clear all tracked changes
     */
    const clearLayoutChanges = useCallback(() => {
        setChangeCount(0);
        setSaveStatus("idle");
        setConflictData(null);
        clearHistory();
    }, [clearHistory]);

    /**
     * Track that a layout change occurred
     * Called from use-environment-grid-sync when GridStack 'change' event fires
     * With command system, this is primarily for UI feedback
     */
    const isCurrentLayoutEqualBaseline = useCallback(() => {
        const baseline = getBaselineSnapshot();
        if (!baseline || !saveGridLayout) {
            return false;
        }

        const currentLayout = saveGridLayout();
        if (!currentLayout) {
            return false;
        }

        return areLayoutsEqual(currentLayout, baseline.gridLayout);
    }, [getBaselineSnapshot, saveGridLayout]);

    const trackLayoutChange = useCallback(() => {
        // Don't track during initialization or discard operations
        if (!hasInitializedRef.current || isDiscardingRef.current) {
            return;
        }

        if (isCurrentLayoutEqualBaseline()) {
            clearLayoutChanges();
            return;
        }

        setChangeCount((prev) => prev + 1);
        markHistoryLayoutChange();
    }, [isCurrentLayoutEqualBaseline, clearLayoutChanges, markHistoryLayoutChange]);

    /**
     * Track that a structural change occurred (re-parent, add, remove block)
     * With command system, structural changes are now undoable
     */
    const trackStructuralChange = useCallback(() => {
        if (!hasInitializedRef.current || isDiscardingRef.current) {
            return;
        }

        setChangeCount((prev) => prev + 1);
        markHistoryStructuralChange();
    }, [markHistoryStructuralChange]);

    /**
     * Check if discard is allowed
     * With command system, discard is always allowed via undo
     */
    const canDiscard = useCallback(() => {
        return true;
    }, []);

    /**
     * Check if there are unsaved layout changes
     */
    const hasLayoutChanges = useCallback(() => {
        return hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    /**
     * Discard all layout changes by clearing history and reloading from last save
     * Called when user clicks "Discard All" in EditModeIndicator
     * With command system, this clears all commands and reloads from saved state
     */
    const discardLayoutChanges = useCallback(() => {
        const snapshot = getBaselineSnapshot();
        if (!snapshot) {
            console.warn("Cannot discard layout: missing saved snapshot");
            return;
        }

        // Set flag to prevent tracking reload events
        isDiscardingRef.current = true;

        try {
            // Clear command history immediately (don't undo - just discard)
            clearLayoutChanges();

            applySnapshot(snapshot);
        } catch (error) {
            console.error("Failed to discard layout changes:", error);
        } finally {
            // Re-enable tracking after delay
            setTimeout(() => {
                isDiscardingRef.current = false;
            }, 500);
        }
    }, [clearLayoutChanges, getBaselineSnapshot, applySnapshot]);

    /**
     * Save current layout state to backend with version control
     * Called when user clicks "Save All" in EditModeIndicator
     */
    const saveLayoutChanges = useCallback(async (): Promise<boolean> => {
        if (!layoutId || !saveGridLayout) {
            console.warn("Cannot save layout: missing layoutId or save function");
            return false;
        }

        setSaveStatus("saving");

        try {
            // Get current layout from GridStack with preserved JSON content
            const currentLayout = saveGridLayout();

            if (!currentLayout) {
                console.warn("Failed to get layout from GridStack");
                setSaveStatus("error");
                return false;
            }

            // Get structural operations since last save
            const operations = getStructuralOperations();

            console.log(`💾 Saving layout with ${operations.length} structural operations`);

            // TODO: Call backend with version control
            // For now, simulate the response
            const response: SaveLayoutResponse = await saveBlockEnvironment(
                layoutId,
                currentLayout,
                publishedVersion,
                operations
            );

            if (response.conflict) {
                // Version mismatch - another user saved first
                console.warn("⚠️ [SAVE] Conflict detected - version mismatch", {
                    ourVersion: publishedVersion,
                    theirVersion: response.latestVersion,
                    lastModifiedBy: response.lastModifiedBy,
                });

                setSaveStatus("conflict");
                setConflictData(response);

                // Don't clear changes - let user resolve conflict
                return false;
            }

            if (!response.success) {
                console.error("Failed to save layout:", response.error);
                setSaveStatus("error");
                setTimeout(() => setSaveStatus("idle"), 3000);
                return false;
            }

            // Success - update version and clear history
            const nextVersion = response.newVersion ?? publishedVersion + 1;

            const snapshot: LayoutSnapshot = {
                blockEnvironment: getEnvironmentSnapshot(),
                gridLayout: currentLayout,
                timestamp: Date.now(),
                version: nextVersion,
            };
            setBaselineSnapshot(snapshot);
            updatePublishedVersion(nextVersion);

            // Clear operations on successful save
            clearStructuralOperations();

            requestAnimationFrame(() => {
                discardLayoutChanges();
            });

            setSaveStatus("success");

            // Reset success status after 2 seconds
            setTimeout(() => setSaveStatus("idle"), 2000);

            return true;
        } catch (error) {
            console.error("Failed to save layout:", error);
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
            return false;
        }
    }, [
        layoutId,
        saveGridLayout,
        environment,
        publishedVersion,
        clearLayoutChanges,
        getEnvironmentSnapshot,
        setBaselineSnapshot,
        updatePublishedVersion,
        discardLayoutChanges,
        getStructuralOperations,
        clearStructuralOperations,
    ]);

    /**
     * Resolve a conflict after user makes a decision
     */
    const resolveConflict = useCallback(
        async (action: "keep-mine" | "use-theirs" | "cancel"): Promise<boolean> => {
            if (!conflictData) {
                console.warn("No conflict to resolve");
                return false;
            }

            try {
                if (action === "cancel") {
                    // User cancelled - just clear conflict state
                    setSaveStatus("idle");
                    setConflictData(null);
                    return false;
                }

                if (action === "use-theirs") {
                    // Discard local changes and use server version
                    if (conflictData.latestLayout && conflictData.latestVersion) {
                        const serverSnapshot: LayoutSnapshot = {
                            blockEnvironment: cloneEnvironment(conflictData.latestEnvironment!),
                            gridLayout: structuredClone(
                                conflictData.latestLayout
                            ) as GridStackOptions,
                            timestamp: Date.now(),
                            version: conflictData.latestVersion,
                        };

                        setBaselineSnapshot(serverSnapshot);

                        requestAnimationFrame(() => {
                            if (!conflictData.latestVersion) return;
                            discardLayoutChanges();
                            updatePublishedVersion(conflictData.latestVersion);
                        });

                        setSaveStatus("success");
                        setConflictData(null);
                        setTimeout(() => setSaveStatus("idle"), 2000);
                        return true;
                    }
                }

                if (action === "keep-mine") {
                    // Force overwrite with our version

                    const currentLayout = saveGridLayout();
                    if (!currentLayout) {
                        setSaveStatus("error");
                        return false;
                    }

                    const operations = getStructuralOperations();

                    // TODO: Send force save to backend with latest version number
                    const response: SaveLayoutResponse = await saveBlockEnvironment(
                        layoutId!,
                        currentLayout,
                        conflictData.latestVersion!,
                        operations,
                        true // force flag
                    );

                    if (response.success) {
                        const nextVersion = response.newVersion ?? publishedVersion + 1;
                        const snapshot: LayoutSnapshot = {
                            blockEnvironment: getEnvironmentSnapshot(),
                            gridLayout: currentLayout,
                            timestamp: Date.now(),
                            version: nextVersion,
                        };

                        setBaselineSnapshot(snapshot);
                        updatePublishedVersion(nextVersion);

                        // Clear operations on successful save
                        clearStructuralOperations();

                        requestAnimationFrame(() => {
                            discardLayoutChanges();
                        });

                        setSaveStatus("success");
                        setConflictData(null);
                        setTimeout(() => setSaveStatus("idle"), 2000);
                        return true;
                    } else {
                        setSaveStatus("error");
                        return false;
                    }
                }

                return false;
            } catch (error) {
                console.error("Failed to resolve conflict:", error);
                setSaveStatus("error");
                return false;
            }
        },
        [
            conflictData,
            saveGridLayout,
            layoutId,
            environment,
            publishedVersion,
            clearLayoutChanges,
            getEnvironmentSnapshot,
            applySnapshot,
            discardLayoutChanges,
            setBaselineSnapshot,
            updatePublishedVersion,
            getStructuralOperations,
            clearStructuralOperations,
        ]
    );

    // TODO: Uncomment this eventually
    /**
     * Warn user before leaving page if there are unsaved changes
     */
    // useEffect(() => {
    //     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    //         if (hasUnsavedChanges) {
    //             e.preventDefault();
    //             e.returnValue = "You have unsaved layout changes. Are you sure you want to leave?";
    //         }
    //     };

    //     window.addEventListener("beforeunload", handleBeforeUnload);
    //     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    // }, [hasUnsavedChanges]);

    const value: LayoutChangeContextValue = useMemo(
        () => ({
            hasLayoutChanges,
            trackLayoutChange,
            trackStructuralChange,
            clearLayoutChanges,
            saveLayoutChanges,
            discardLayoutChanges,
            canDiscard,
            publishedVersion,
            localVersion,
            layoutChangeCount: changeCount,
            saveStatus,
            conflictData,
            resolveConflict,
        }),
        [
            hasLayoutChanges,
            trackLayoutChange,
            trackStructuralChange,
            clearLayoutChanges,
            saveLayoutChanges,
            discardLayoutChanges,
            canDiscard,
            publishedVersion,
            localVersion,
            changeCount,
            saveStatus,
            conflictData,
            resolveConflict,
        ]
    );

    return <LayoutChangeContext.Provider value={value}>{children}</LayoutChangeContext.Provider>;
};

// Todo: Set up a more efficient and accurate diffing mechanism
function areLayoutsEqual(a: GridStackOptions, b: GridStackOptions): boolean {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch (error) {
        console.debug("Failed to compare layouts:", error);
        return false;
    }
}

async function saveBlockEnvironment(
    layoutId: string,
    layout: GridStackOptions,
    currentVersion: number,
    operations: StructuralOperationRecord[],
    force: boolean = false
): Promise<SaveLayoutResponse> {
    // Simulate network delay
    console.log("💾 Saving layout:", {
        layoutId,
        version: currentVersion,
        operationCount: operations.length,
        operations,
    });
    console.log(operations);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate 5% chance of conflict (for testing)
    const hasConflict = !force && Math.random() < 0.05;

    if (hasConflict) {
        return {
            success: false,
            conflict: true,
            latestLayout: layout, // In real scenario, this would be from backend
            // latestEnvironment: environment,
            latestVersion: currentVersion + 1,
            lastModifiedBy: "john@example.com",
            lastModifiedAt: new Date().toISOString(),
        };
    }

    return {
        success: true,
        newVersion: currentVersion + 1,
        conflict: false,
    };
}
