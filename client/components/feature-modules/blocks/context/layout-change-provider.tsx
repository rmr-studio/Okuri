"use client";

import { useAuth } from "@/components/provider/auth-context";
import { formatError } from "@/lib/util/error/error.util";
import { now } from "@/lib/util/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { BlockNode, isContentNode } from "../interface/block.interface";
import {
    LayoutSnapshot,
    SaveEnvironmentRequest,
    SaveEnvironmentResponse,
} from "../interface/command.interface";
import { LayoutService } from "../service/layout.service";
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

    /** Track that a content change occurred (block update) */
    trackContentChange: () => void;

    /** Clear all tracked changes */
    clearLayoutChanges: () => void;

    /** Save layout changes to backend with version control */
    saveLayoutChanges: () => Promise<boolean>;

    /** Discard layout changes and reload from last saved state */
    discardLayoutChanges: () => void;

    /** Check if discard is allowed (always true with command system) */
    canDiscard: () => boolean;

    /** Suppress layout change tracking temporarily (e.g., during edit mode transitions) */
    suppressEditModeTracking: (suppress: boolean) => void;

    /** Number of layout change events (for UI feedback) */
    layoutChangeCount: number;

    /** Version synced with backend (published) */
    publishedVersion: number;

    /** Local-only version used for forcing re-renders on client-side resets */
    localVersion: number;

    /** Save status for UI feedback */
    saveStatus: "idle" | "saving" | "success" | "error" | "conflict";

    /** Conflict data if save failed due to version mismatch */
    conflictData: SaveEnvironmentResponse | null;

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

/**
 * Applies ID mappings to the block environment, updating all temporary IDs to permanent database IDs.
 * This recursively updates all blocks in all trees, and updates the hierarchy and treeIndex maps.
 */
function applyIdMapping(
    environment: ReturnType<typeof useBlockEnvironment>["environment"],
    idMappings: Record<string, string>
): void {
    if (!environment?.trees) return;

    const updateNodeIds = (node: BlockNode): void => {
        // Update block ID
        if (node.block?.id && idMappings[node.block.id]) {
            node.block.id = idMappings[node.block.id];
        }

        // Recursively update children in content nodes
        if (isContentNode(node) && node.children) {
            node.children.forEach(updateNodeIds);
        }
    };

    // Update all trees
    environment.trees.forEach((tree) => {
        if (tree.root) {
            updateNodeIds(tree.root);
        }
    });

    // Update hierarchy map (blockId -> parentId)
    if (environment.hierarchy) {
        const newHierarchy = new Map<string, string | null>();

        environment.hierarchy.forEach((parentId, blockId) => {
            // Map the blockId if it needs to be updated
            const newBlockId = idMappings[blockId] || blockId;
            // Map the parentId if it needs to be updated (null stays null)
            const newParentId =
                parentId !== null && idMappings[parentId] ? idMappings[parentId] : parentId;

            newHierarchy.set(newBlockId, newParentId);
        });

        // Replace the old map with the updated one
        environment.hierarchy = newHierarchy;
    }

    // Update treeIndex map (blockId -> rootId)
    if (environment.treeIndex) {
        const newTreeIndex = new Map<string, string>();

        environment.treeIndex.forEach((rootId, blockId) => {
            // Map the blockId if it needs to be updated
            const newBlockId = idMappings[blockId] || blockId;
            // Map the rootId if it needs to be updated
            const newRootId = idMappings[rootId] || rootId;

            newTreeIndex.set(newBlockId, newRootId);
        });

        // Replace the old map with the updated one
        environment.treeIndex.clear();
        newTreeIndex.forEach((rootId, blockId) => {
            environment.treeIndex.set(blockId, rootId);
        });
    }
}

export const LayoutChangeProvider: FC<PropsWithChildren> = ({ children }) => {
    const {
        layoutId,
        layout,
        organisationId,
        entityId,
        entityType,
        isInitialized,
        environment,
        hydrateEnvironment,
        getEnvironmentSnapshot,
    } = useBlockEnvironment();
    const { gridStack, save: saveGridLayout, reloadEnvironment } = useGrid();
    const {
        markLayoutChange: markHistoryLayoutChange,
        markStructuralChange: markHistoryStructuralChange,
        markContentChange: markHistoryContentChange,
        clearHistory,
        hasUnsavedChanges,
        hasLayoutChanges: historyHasLayoutChanges,
        setBaselineSnapshot,
        getBaselineSnapshot,
        getStructuralOperations,
        clearStructuralOperations,
    } = useLayoutHistory();

    const { session } = useAuth();
    const [publishedVersion, setPublishedVersion] = useState(layout?.version ?? 0);
    const [localVersion, setLocalVersion] = useState(0);
    const [changeCount, setChangeCount] = useState(0);
    const [saveStatus, setSaveStatus] = useState<
        "idle" | "saving" | "success" | "error" | "conflict"
    >("idle");
    const [conflictData, setConflictData] = useState<SaveEnvironmentResponse | null>(null);
    const queryClient = useQueryClient();

    const { mutateAsync: saveLayout } = useMutation({
        mutationFn: (request: SaveEnvironmentRequest) =>
            LayoutService.saveLayoutSnapshot(session, request),
        onMutate: () => {
            setSaveStatus("saving");
        },
        onError: (error: Error) => {
            const errorMsg = "error" in error ? formatError(error as any) : error.message;
            console.error("Failed to save layout:", errorMsg);
            toast.error("Failed to save layout changes.");
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
            return;
        },
        onSuccess: (response: SaveEnvironmentResponse) => {
            const { idMappings, conflict, newVersion, layout } = response;
            if (!layout) {
                // TODO: Fetch from backend
                console.warn("Failed to get layout from GridStack after save");
                setSaveStatus("error");
                setTimeout(() => setSaveStatus("idle"), 3000);
                return;
            }

            if (conflict) {
                console.warn("⚠️ [SAVE] Conflict detected - version mismatch", {
                    ourVersion: publishedVersion,
                    theirVersion: response.latestVersion,
                    lastModifiedBy: response.lastModifiedBy,
                });

                setSaveStatus("conflict");
                setConflictData(response);
                return;
            }

            const newEnvironment = structuredClone(environment);

            // Apply ID mappings to both environment and layout (update temporary IDs to permanent database IDs)
            if (idMappings && Object.keys(idMappings).length > 0) {
                applyIdMapping(newEnvironment, idMappings);
            }

            // // Update cache with new layout data instead of invalidating (more efficient)
            // queryClient.setQueryData(["layout", organisationId, entityType, entityId], {
            //     layout: newLayout,
            //     version: newVersion || publishedVersion + 1,
            // });

            const snapshot: LayoutSnapshot = {
                blockEnvironment: newEnvironment,
                gridLayout: layout,
                timestamp: now(),
                version: newVersion || publishedVersion + 1,
            };
            setBaselineSnapshot(snapshot);
            updatePublishedVersion(newVersion || publishedVersion + 1);

            // Clear operations on successful save
            clearStructuralOperations();

            requestAnimationFrame(() => {
                discardLayoutChanges(snapshot);
            });

            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 2000);
        },
    });

    const { mutate: overwriteLayout } = useMutation({});

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
    // Flag to prevent tracking during edit mode transitions (form resize)
    const isTogglingEditModeRef = useRef(false);

    // Capture initial snapshot when a layout is provided from the server
    useEffect(() => {
        if (!layout?.layout) return;

        const snapshot: LayoutSnapshot = {
            blockEnvironment: getEnvironmentSnapshot(),
            gridLayout: structuredClone(layout.layout) as GridStackOptions,
            timestamp: now(),
            version: layout.version ?? 0,
        };

        setBaselineSnapshot(snapshot);
        updatePublishedVersion(layout.version ?? 0);
    }, [
        layout?.layout,
        layout?.version,
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
     * Suppress layout change tracking temporarily (e.g., during edit mode transitions)
     * Used to prevent false positives when blocks resize for form rendering
     */
    const suppressEditModeTracking = useCallback((suppress: boolean) => {
        isTogglingEditModeRef.current = suppress;
    }, []);

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
        // Don't track during initialization, discard operations, or edit mode transitions
        if (
            !hasInitializedRef.current ||
            isDiscardingRef.current ||
            isTogglingEditModeRef.current
        ) {
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
     * Track that a content change occurred (block update)
     * Content changes don't affect layout structure
     */
    const trackContentChange = useCallback(() => {
        if (!hasInitializedRef.current || isDiscardingRef.current) {
            return;
        }

        setChangeCount((prev) => prev + 1);
        markHistoryContentChange();
    }, [markHistoryContentChange]);

    /**
     * Check if discard is allowed
     * With command system, discard is always allowed via undo
     */
    const canDiscard = useCallback(() => {
        return true;
    }, []);

    /**
     * Check if there are unsaved layout changes (structural/positional, not content)
     */
    const hasLayoutChanges = useCallback(() => {
        return historyHasLayoutChanges;
    }, [historyHasLayoutChanges]);

    /**
     * Discard all layout changes by clearing history and reloading from last save
     * Called when user clicks "Discard All" in EditModeIndicator
     * With command system, this clears all commands and reloads from saved state
     */
    const discardLayoutChanges = useCallback(
        (snapshot: LayoutSnapshot | null = null) => {
            const curr = snapshot || getBaselineSnapshot();
            if (!curr) {
                console.warn("Cannot discard layout: missing saved snapshot");
                return;
            }

            // Set flag to prevent tracking reload events
            isDiscardingRef.current = true;

            try {
                // Clear command history immediately (don't undo - just discard)
                clearLayoutChanges();

                applySnapshot(curr);
            } catch (error) {
                console.error("Failed to discard layout changes:", error);
            } finally {
                // Re-enable tracking after delay
                setTimeout(() => {
                    isDiscardingRef.current = false;
                }, 500);
            }
        },
        [clearLayoutChanges, getBaselineSnapshot, applySnapshot]
    );

    /**
     * Save current layout state to backend with version control
     * Called when user clicks "Save All" in EditModeIndicator
     */
    const saveLayoutChanges = useCallback(async (): Promise<boolean> => {
        if (!layoutId || !saveGridLayout) {
            console.warn("Cannot save layout: missing layoutId or save function");
            return false;
        }

        // Get structural operations since last save
        const operations = getStructuralOperations();

        // Get current layout from GridStack with preserved JSON content
        const currentLayout = saveGridLayout();
        if (!currentLayout) {
            console.warn("Cannot save layout: failed to get current layout from GridStack");
            return false;
        }

        const nextVersion = publishedVersion + 1;

        // Prepare save request
        const saveRequest: SaveEnvironmentRequest = {
            layoutId,
            organisationId,
            layout: currentLayout,
            version: nextVersion,
            operations,
        };

        try {
            const { success, conflict } = await saveLayout(saveRequest);
            return success && !conflict;
        } catch (error) {
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
        saveLayout,
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
                    //TODO: Load and reinit environment with server version
                }

                if (action === "keep-mine") {
                    const currentLayout = saveGridLayout();
                    if (!currentLayout) {
                        setSaveStatus("error");
                        return false;
                    }

                    // TODO: Send Entire Snapshot and Environment to backend to overwrite server version
                    overwriteLayout();
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
            trackContentChange,
            clearLayoutChanges,
            saveLayoutChanges,
            discardLayoutChanges,
            canDiscard,
            suppressEditModeTracking,
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
            trackContentChange,
            clearLayoutChanges,
            saveLayoutChanges,
            discardLayoutChanges,
            canDiscard,
            suppressEditModeTracking,
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
