import { useEffect } from "react";
import { CustomToolbarAction } from "../toolbar/panel-toolbar";
import { ToolbarIndices } from "./use-panel-toolbar-indices";

export interface UsePanelKeyboardNavigationOptions {
    id: string;
    isSelected: boolean;
    allowInsert: boolean;
    actionsLength: number;

    // State from context
    toolbarFocusIndex: number;
    setToolbarFocusIndex: (index: number | ((prev: number) => number)) => void;

    // Menu handlers
    setInlineMenuOpen: (open: boolean) => void;
    setQuickOpen: (open: boolean) => void;
    setDetailsOpen: (open: boolean) => void;
    setActionsOpen: (open: boolean) => void;

    // Edit handlers (from usePanelEditMode)
    handleEditClick: () => void;
    handleSaveEditClick: () => void;
    handleDiscardEditClick: () => void;

    // Custom actions
    customActions: CustomToolbarAction[];

    // Toolbar indices (from usePanelToolbarIndices)
    toolbarIndices: ToolbarIndices;

    // Other handlers
    focusSelf: () => void;
    setInsertContext: (context: "nested" | "sibling") => void;

    // Dependencies
    hasMenuActions: boolean;
    isEditMode: boolean;
    hasChildren: boolean;
    openDrawer: (id: string) => void;
    saveAndExit: (id: string) => Promise<boolean>;
    startEdit: (id: string, mode: "inline" | "drawer") => void;
    suppressEditModeTracking: (suppress: boolean) => void;
}

/**
 * usePanelKeyboardNavigation - Handle all keyboard shortcuts and toolbar navigation
 *
 * Purpose: Extracts ~190 lines of keyboard logic from panel-wrapper.tsx (lines 410-602)
 *
 * Keyboard Shortcuts:
 * - ArrowLeft/ArrowRight: Navigate toolbar buttons
 * - Enter: Activate focused toolbar button
 * - /: Open inline insert menu
 * - Cmd+E: Toggle inline edit mode
 * - Cmd+Shift+E: Open drawer for any block
 * - Cmd+K: Open quick actions or insert menu
 *
 * Responsibilities:
 * - Attach keydown event listener when isSelected is true
 * - Check for input elements to avoid capturing form input
 * - Blur focused toolbar button before navigation
 * - Coordinate toolbar focus index with menu open states
 * - Call appropriate handlers based on key combination
 */
export function usePanelKeyboardNavigation(
    options: UsePanelKeyboardNavigationOptions
): void {
    const {
        id,
        isSelected,
        allowInsert,
        actionsLength,
        toolbarFocusIndex,
        setToolbarFocusIndex,
        setInlineMenuOpen,
        setQuickOpen,
        setDetailsOpen,
        setActionsOpen,
        handleEditClick,
        handleSaveEditClick,
        handleDiscardEditClick,
        customActions,
        toolbarIndices,
        focusSelf,
        setInsertContext,
        hasMenuActions,
        isEditMode,
        hasChildren,
        openDrawer,
        saveAndExit,
        startEdit,
        suppressEditModeTracking,
    } = options;

    useEffect(() => {
        if (!isSelected) return;

        const handler = (event: KeyboardEvent) => {
            const active = document.activeElement;
            const isInput =
                active &&
                (active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.getAttribute("contenteditable") === "true");

            // Toolbar keyboard navigation
            // NOTE: Toolbar menus must use Popover, NOT DropdownMenu to avoid DOM focus conflicts.
            // See panel-toolbar.tsx and panel-actions.tsx for implementation details.

            // Toolbar navigation with Left/Right arrows
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                if (isInput) return;
                event.preventDefault();

                // Blur any focused toolbar button to prevent it from capturing Enter key
                const activeElement = document.activeElement as HTMLElement | null;
                if (activeElement && typeof activeElement.blur === "function") {
                    activeElement.blur();
                }

                if (toolbarFocusIndex === -1) {
                    // First time pressing arrow - focus first toolbar button
                    setToolbarFocusIndex(0);
                } else {
                    // Navigate between toolbar buttons
                    if (event.key === "ArrowLeft") {
                        setToolbarFocusIndex((prev) =>
                            prev <= 0 ? toolbarIndices.count - 1 : prev - 1
                        );
                    } else {
                        setToolbarFocusIndex((prev) =>
                            prev >= toolbarIndices.count - 1 ? 0 : prev + 1
                        );
                    }
                }
                return;
            }

            // Activate focused toolbar button with Enter
            if (event.key === "Enter" && toolbarFocusIndex >= 0) {
                if (isInput) return;
                event.preventDefault();

                const {
                    quickActionsIndex,
                    insertIndex,
                    editIndex,
                    customActionsIndices,
                    saveEditIndex,
                    discardEditIndex,
                    detailsIndex,
                    actionsMenuIndex,
                } = toolbarIndices;

                // Handle edit button activation
                if (toolbarFocusIndex === editIndex) {
                    handleEditClick();
                    return;
                }

                // Handle custom actions activation
                const customActionIndex = customActionsIndices.indexOf(toolbarFocusIndex);
                if (customActionIndex !== -1) {
                    const action = customActions[customActionIndex];
                    if (action && !action.disabled) {
                        action.onClick();
                    }
                    return;
                }

                // Handle save/discard edit buttons
                if (toolbarFocusIndex === saveEditIndex && saveEditIndex !== -1) {
                    handleSaveEditClick();
                    return;
                }
                if (toolbarFocusIndex === discardEditIndex && discardEditIndex !== -1) {
                    handleDiscardEditClick();
                    return;
                }

                // Handle other menu buttons
                setQuickOpen(toolbarFocusIndex === quickActionsIndex);
                setInlineMenuOpen(toolbarFocusIndex === insertIndex && insertIndex !== -1);
                setDetailsOpen(toolbarFocusIndex === detailsIndex);
                setActionsOpen(toolbarFocusIndex === actionsMenuIndex && actionsMenuIndex !== -1);

                return;
            }

            if (
                allowInsert &&
                event.key === "/" &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey
            ) {
                if (isInput) return;
                event.preventDefault();
                setInsertContext("nested");
                focusSelf();
                setInlineMenuOpen(true);
            }

            // Cmd+E or Cmd+Shift+E: Edit mode
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
                event.preventDefault();

                if (event.shiftKey) {
                    // Cmd+Shift+E: Always open drawer for any block
                    openDrawer(id);
                } else {
                    // Cmd+E: Inline edit for simple blocks, drawer for containers
                    if (hasChildren) {
                        // Has children: open drawer
                        openDrawer(id);
                    } else {
                        // No children: toggle inline edit
                        if (isEditMode) {
                            // Exit edit mode and save
                            suppressEditModeTracking(true);
                            saveAndExit(id).then((success) => {
                                if (success) {
                                    // Re-enable tracking after triple RAF
                                    requestAnimationFrame(() => {
                                        requestAnimationFrame(() => {
                                            requestAnimationFrame(() => {
                                                suppressEditModeTracking(false);
                                            });
                                        });
                                    });
                                } else {
                                    suppressEditModeTracking(false);
                                }
                            });
                        } else {
                            // Enter edit mode
                            suppressEditModeTracking(true);
                            startEdit(id, "inline");
                            // Re-enable tracking after triple RAF
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        suppressEditModeTracking(false);
                                    });
                                });
                            });
                        }
                    }
                }
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (allowInsert && actionsLength === 0) {
                    setInsertContext("nested");
                    focusSelf();
                    setInlineMenuOpen(true);
                } else {
                    setQuickOpen(true);
                    focusSelf();
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        allowInsert,
        actionsLength,
        focusSelf,
        isSelected,
        toolbarFocusIndex,
        setToolbarFocusIndex,
        toolbarIndices,
        hasMenuActions,
        isEditMode,
        hasChildren,
        openDrawer,
        saveAndExit,
        startEdit,
        id,
        handleEditClick,
        customActions,
        handleSaveEditClick,
        handleDiscardEditClick,
        setInlineMenuOpen,
        setQuickOpen,
        setDetailsOpen,
        setActionsOpen,
        setInsertContext,
        suppressEditModeTracking,
    ]);
}
