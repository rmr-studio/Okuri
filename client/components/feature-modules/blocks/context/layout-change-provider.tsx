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
import { useBlockEnvironment } from "./block-environment-provider";
import { useGrid } from "./grid-provider";

interface LayoutChangeContextValue {
    /** Check if there are unsaved layout changes */
    hasLayoutChanges: () => boolean;

    /** Track that a layout change occurred */
    trackLayoutChange: () => void;

    /** Track that a structural change occurred (re-parent, add, remove) */
    trackStructuralChange: () => void;

    /** Clear all tracked changes */
    clearLayoutChanges: () => void;

    /** Save layout changes to backend (stub for now) */
    saveLayoutChanges: () => Promise<boolean>;

    /** Discard layout changes and reload from last saved state */
    discardLayoutChanges: () => void;

    /** Check if discard is allowed (no structural changes) */
    canDiscard: () => boolean;

    /** Number of layout change events (for UI feedback) */
    layoutChangeCount: number;

    version: number;
    setVersion: (v: number) => void;

    /** Save status for UI feedback */
    saveStatus: "idle" | "saving" | "success" | "error";
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
    const { layoutId, blockTreeLayout, isInitialized } = useBlockEnvironment();
    const { gridStack, save: saveGridLayout, reloadEnvironment } = useGrid();
    const [version, setVersion] = useState(0);
    const [hasChanges, setHasChanges] = useState(false);
    const [changeCount, setChangeCount] = useState(0);
    const [hasStructuralChanges, setHasStructuralChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

    // Store the last saved layout state for discard functionality
    const lastSavedLayoutRef = useRef<GridStackOptions | null>(blockTreeLayout?.layout ?? null);

    // Flag to prevent tracking during discard/initialization
    const isDiscardingRef = useRef(false);
    const hasInitializedRef = useRef(false);

    // Update last saved layout when blockTreeLayout changes (initial load or external updates)
    useEffect(() => {
        if (blockTreeLayout?.layout) {
            lastSavedLayoutRef.current = blockTreeLayout.layout;
            console.log("📐 [LOCAL] Updated lastSavedLayoutRef from blockTreeLayout:", {
                widgetCount: blockTreeLayout.layout.children?.length ?? 0,
                hasContainers: blockTreeLayout.layout.children?.some(
                    (w) => w.subGridOpts?.children
                ),
            });
        }
    }, [blockTreeLayout?.layout]);

    // Mark as initialized once BlockEnvironment is ready
    // Add a small delay to ensure all widgets finish syncing
    useEffect(() => {
        if (isInitialized && !hasInitializedRef.current) {
            // Wait 200ms after initialization to ensure widget sync completes
            const timer = setTimeout(() => {
                hasInitializedRef.current = true;
                console.log("📐 [LOCAL] Layout change tracking initialized");
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [isInitialized]);

    /**
     * Track that a layout change occurred
     * Called from use-environment-grid-sync when GridStack 'change' event fires
     */
    const trackLayoutChange = useCallback(() => {
        // Don't track during initialization or discard operations
        if (!hasInitializedRef.current || isDiscardingRef.current) {
            return;
        }

        setHasChanges(true);
        setChangeCount((prev) => prev + 1);
    }, []);

    /**
     * Track that a structural change occurred (re-parent, add, remove block)
     * These changes can't be discarded because they modify BlockEnvironment
     */
    const trackStructuralChange = useCallback(() => {
        if (!hasInitializedRef.current || isDiscardingRef.current) {
            return;
        }

        setHasStructuralChanges(true);
        console.log("⚠️ [LOCAL] Structural change detected - discard disabled");
    }, []);

    /**
     * Clear all tracked changes
     */
    const clearLayoutChanges = useCallback(() => {
        setHasChanges(false);
        setChangeCount(0);
        setHasStructuralChanges(false);
        setSaveStatus("idle");
    }, []);

    /**
     * Check if discard is allowed
     * Discard is not allowed if there have been structural changes
     */
    const canDiscard = useCallback(() => {
        return !hasStructuralChanges;
    }, [hasStructuralChanges]);

    /**
     * Check if there are unsaved layout changes
     */
    const hasLayoutChanges = useCallback(() => hasChanges, [hasChanges]);

    /**
     * Save current layout state to backend
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
            // Uses GridProvider's save() which preserves widget metadata instead of HTML
            const currentLayout = saveGridLayout();

            if (!currentLayout) {
                console.warn("Failed to get layout from GridStack");
                return false;
            }

            // Save to backend (stub for now - will use TanStack Query)
            // await LayoutService.saveLayoutSnapshot(layoutId, currentLayout);

            // For now, just log and simulate success
            console.log("💾 [LOCAL] Layout saved successfully", {
                layoutId,
                widgetCount: currentLayout.children?.length ?? 0,
                hasContainers: currentLayout.children?.some((w) => w.subGridOpts?.children),
                containerWidgets: currentLayout.children
                    ?.filter((w) => w.subGridOpts?.children)
                    .map((w) => ({ id: w.id, childCount: w.subGridOpts?.children?.length })),
            });

            // Update last saved state
            lastSavedLayoutRef.current = currentLayout;
            console.log("💾 [LOCAL] Updated lastSavedLayoutRef after save");

            // Clear change tracking
            clearLayoutChanges();
            setSaveStatus("success");

            // Reset success status after 2 seconds
            setTimeout(() => setSaveStatus("idle"), 2000);

            return true;
        } catch (error) {
            console.error("Failed to save layout:", error);
            setSaveStatus("error");

            // Reset error status after 3 seconds
            setTimeout(() => setSaveStatus("idle"), 3000);

            return false;
        }
    }, [layoutId, saveGridLayout, clearLayoutChanges]);

    /**
     * Discard all layout changes and reload from last saved state
     * Called when user clicks "Discard All" in EditModeIndicator
     */
    const discardLayoutChanges = useCallback(() => {
        if (!gridStack || !lastSavedLayoutRef.current) {
            console.warn("Cannot discard layout: missing gridStack or saved state");
            return;
        }

        // Prevent discard if there have been structural changes
        if (hasStructuralChanges) {
            console.error(
                "❌ Cannot discard: structural changes detected (re-parenting, add/remove blocks). Please save or refresh the page."
            );
            return;
        }

        console.log("🔄 [LOCAL] Discarding layout changes, reloading from saved state");

        // Set flag to prevent tracking reload events
        isDiscardingRef.current = true;

        try {
            // Validate saved layout before reloading
            const savedChildren = lastSavedLayoutRef.current.children;
            if (!savedChildren || savedChildren.length === 0) {
                console.warn("No saved layout children to restore");
                clearLayoutChanges();
                return;
            }

            // Validate that all widgets have valid content
            const validChildren = savedChildren.every((widget) => {
                // If widget has content, verify it's valid JSON or empty
                if (widget.content && typeof widget.content === "string") {
                    try {
                        JSON.parse(widget.content);
                        return true;
                    } catch (e) {
                        console.error(
                            `Invalid widget content for widget ${widget.id}:`,
                            widget.content
                        );
                        return false;
                    }
                }
                return true; // No content or content is not a string
            });

            if (!validChildren) {
                console.error("❌ Cannot discard: saved layout contains invalid widget content");
                return;
            }

            console.log("🔄 [LOCAL] Discarding - saved layout structure:", {
                totalWidgets: savedChildren.length,
                hasContainers: savedChildren.some((w) => w.subGridOpts?.children),
                containerWidgets: savedChildren
                    .filter((w) => w.subGridOpts?.children)
                    .map((w) => ({ id: w.id, childCount: w.subGridOpts?.children?.length })),
            });
            
            setVersion((v) => v + 1);
            // Reload GridStack from last saved state
            gridStack.load(savedChildren);
            

            // Wait for GridStack DOM updates to complete before syncing environment
            requestAnimationFrame(() => {
                // Sync GridProvider environment with reloaded layout
                // Must happen after gridStack.load() DOM updates complete
                console.log("🔄 [LOCAL] Reloading environment after gridStack.load()");
                reloadEnvironment(lastSavedLayoutRef.current);

                // Trigger resize for all layout containers to properly fit children
                // This prevents child widgets from being misaligned after discard
                requestAnimationFrame(() => {
                    try {
                        // Find all widgets with subgrids (layout containers)
                        gridStack.engine.nodes.forEach((node) => {
                            if (node.subGrid && node.el) {
                                // Trigger resize to reflow children
                                node.subGrid.onResize();
                            }
                        });
                        console.log("🔄 [LOCAL] Triggered resize for layout containers");
                    } catch (error) {
                        console.debug("Layout container resize error (non-critical):", error);
                    }
                });
            });

            // Clear change tracking
            clearLayoutChanges();
        } catch (error) {
            console.error("Failed to discard layout changes:", error);
        } finally {
            // Re-enable tracking after delay to let GridStack settle
            // Extended delay accounts for:
            // - gridStack.load() DOM updates
            // - subGrid.onResize() operations
            // - Child widget repositioning
            // - Animation frames
            setTimeout(() => {
                isDiscardingRef.current = false;
            }, 500);
        }
    }, [gridStack, clearLayoutChanges, hasStructuralChanges, reloadEnvironment]);

    /**
     * Warn user before leaving page if there are unsaved changes
     */
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = "You have unsaved layout changes. Are you sure you want to leave?";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasChanges]);

    const value: LayoutChangeContextValue = {
        hasLayoutChanges,
        trackLayoutChange,
        trackStructuralChange,
        clearLayoutChanges,
        saveLayoutChanges,
        discardLayoutChanges,
        canDiscard,
        version,
        setVersion,
        layoutChangeCount: changeCount,
        saveStatus,
    };

    return (
        <LayoutChangeContext.Provider
            value={useMemo(
                () => value,
                [hasChanges, changeCount, hasStructuralChanges, saveStatus, version]
            )}
        >
            {children}
        </LayoutChangeContext.Provider>
    );
};
