import { useCallback, useEffect, useRef, useState } from "react";
import { useBlockEdit } from "../../../context/block-edit-provider";
import { useLayoutChange } from "../../../context/layout-change-provider";

export interface UsePanelEditModeOptions {
    id: string;
    hasChildren: boolean;
    requestResize?: () => void;
}

export interface UsePanelEditModeReturn {
    isEditMode: boolean;
    handleEditClick: () => void;
    handleSaveEditClick: () => void;
    handleDiscardEditClick: () => void;
}

/**
 * usePanelEditMode - Orchestrate edit mode flows (inline/drawer), save/discard, and resize coordination
 *
 * Purpose: Extracts ~150 lines of edit mode logic from panel-wrapper.tsx (lines 80-123, 297-408)
 *
 * Responsibilities:
 * 1. Edit mode state tracking - sync with BlockEditProvider
 * 2. Edit mode handlers - toggle inline/drawer, save, discard
 * 3. Resize coordination - triple RAF pattern for grid settling
 * 4. Keyboard shortcut integration - expose stable handlers
 *
 * Dependencies:
 * - useBlockEdit() - edit state management
 * - useLayoutChange() - suppress tracking during transitions
 */
export function usePanelEditMode(options: UsePanelEditModeOptions): UsePanelEditModeReturn {
    const { id, hasChildren, requestResize } = options;

    const { startEdit, saveAndExit, openDrawer, getEditMode, cancelEdit } = useBlockEdit();
    const { suppressEditModeTracking } = useLayoutChange();
    const [isEditMode, setEditMode] = useState(false);

    // Track previous edit mode to detect transitions (for resize coordination)
    const prevEditModeRef = useRef<"inline" | "drawer" | null>(null);

    // Sync local edit mode state with provider
    useEffect(() => {
        const editMode = getEditMode(id);
        const prevEditMode = prevEditModeRef.current;

        // Only set to true if in inline mode; drawer mode is handled separately
        setEditMode(editMode === "inline");

        // If transitioning from any edit mode to null (edit mode closed), request resize
        // This handles: individual save/discard, Save All, Discard All, and drawer close
        if (prevEditMode !== null && editMode === null && requestResize) {
            // Use triple requestAnimationFrame to ensure React has fully unmounted
            // the form and mounted the display content before measuring
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        requestResize();
                    });
                });
            });
        }

        prevEditModeRef.current = editMode;
    }, [id, getEditMode, requestResize]);

    /**
     * Handle edit button click
     * - If block has children: open drawer
     * - If block has no children: toggle inline edit mode
     */
    const handleEditClick = useCallback(() => {
        if (hasChildren) {
            // Has children: open drawer
            openDrawer(id);
        } else {
            // No children: toggle inline edit
            if (isEditMode) {
                suppressEditModeTracking(true);
                saveAndExit(id).then((success) => {
                    if (success) {
                        setEditMode(false);
                        // Resize back to display content after exiting edit mode
                        if (requestResize) {
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    requestResize();
                                    // Re-enable tracking after resize completes
                                    requestAnimationFrame(() => {
                                        suppressEditModeTracking(false);
                                    });
                                });
                            });
                        } else {
                            // No resize function, just re-enable after RAF
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    suppressEditModeTracking(false);
                                });
                            });
                        }
                    } else {
                        // Save failed, re-enable tracking
                        suppressEditModeTracking(false);
                    }
                });
            } else {
                // Enter edit mode
                suppressEditModeTracking(true);
                startEdit(id, "inline");
                setEditMode(true);

                // Re-enable tracking after triple RAF (allows grid to settle)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            suppressEditModeTracking(false);
                        });
                    });
                });
            }
        }
    }, [hasChildren, isEditMode, openDrawer, saveAndExit, startEdit, id, requestResize, suppressEditModeTracking]);

    /**
     * Handle save edit button click (explicit save button in toolbar)
     */
    const handleSaveEditClick = useCallback(() => {
        if (isEditMode) {
            suppressEditModeTracking(true);
            saveAndExit(id).then((success) => {
                if (success) {
                    setEditMode(false);
                    // Resize back to display content after saving
                    if (requestResize) {
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                requestResize();
                                // Re-enable tracking after resize completes
                                requestAnimationFrame(() => {
                                    suppressEditModeTracking(false);
                                });
                            });
                        });
                    } else {
                        // No resize function, just re-enable after RAF
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                suppressEditModeTracking(false);
                            });
                        });
                    }
                } else {
                    // Save failed, re-enable tracking
                    suppressEditModeTracking(false);
                }
            });
        }
    }, [isEditMode, saveAndExit, id, requestResize, suppressEditModeTracking]);

    /**
     * Handle discard edit button click
     */
    const handleDiscardEditClick = useCallback(() => {
        if (isEditMode) {
            suppressEditModeTracking(true);
            cancelEdit(id);
            setEditMode(false);
            // Resize back to display content after discarding
            if (requestResize) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        requestResize();
                        // Re-enable tracking after resize completes
                        requestAnimationFrame(() => {
                            suppressEditModeTracking(false);
                        });
                    });
                });
            } else {
                // No resize function, just re-enable after RAF
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        suppressEditModeTracking(false);
                    });
                });
            }
        }
    }, [isEditMode, cancelEdit, id, requestResize, suppressEditModeTracking]);

    return {
        isEditMode,
        handleEditClick,
        handleSaveEditClick,
        handleDiscardEditClick,
    };
}
