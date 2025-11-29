import { useMemo } from "react";

/**
 * Toolbar button indices - represents the position of each button in the toolbar
 * CRITICAL: The order must match the exact render order in panel-toolbar.tsx
 */
export interface ToolbarIndices {
    quickActionsIndex: number;
    insertIndex: number;
    editIndex: number;
    customActionsStartIndex: number;
    customActionsIndices: number[];
    saveEditIndex: number;
    discardEditIndex: number;
    detailsIndex: number;
    actionsMenuIndex: number;
    count: number; // Total button count
}

export interface UsePanelToolbarIndicesOptions {
    allowInsert: boolean;
    hasMenuActions: boolean;
    customActionsCount: number;
    isEditMode: boolean;
}

/**
 * usePanelToolbarIndices - Single source of truth for toolbar button positions
 *
 * Purpose: Eliminates duplication between PanelWrapper (lines 143-173) and PanelToolbar (lines 114-123)
 * Both components consume this hook to ensure button indices stay in sync.
 *
 * IMPORTANT: Button order MUST match the render order in panel-toolbar.tsx
 * Order: Quick Actions → Insert → Edit → Custom Actions → Save/Discard → Details → Actions Menu
 */
export function usePanelToolbarIndices(
    options: UsePanelToolbarIndicesOptions
): ToolbarIndices {
    const { allowInsert, hasMenuActions, customActionsCount, isEditMode } = options;

    return useMemo(() => {
        let buttonIndex = 0;

        // Button order (must match panel-toolbar.tsx render order)
        const quickActionsIndex = buttonIndex++; // Always present
        const insertIndex = allowInsert ? buttonIndex++ : -1;
        const editIndex = buttonIndex++; // Always present (handleEditClick is always defined)

        // Custom actions (dynamic count)
        const customActionsStartIndex = buttonIndex;
        const customActionsIndices = Array.from(
            { length: customActionsCount },
            () => buttonIndex++
        );

        // Edit mode actions (save/discard) - only present in edit mode
        const saveEditIndex = isEditMode ? buttonIndex++ : -1;
        const discardEditIndex = isEditMode ? buttonIndex++ : -1;

        const detailsIndex = buttonIndex++; // Always present
        const actionsMenuIndex = hasMenuActions ? buttonIndex++ : -1;

        return {
            quickActionsIndex,
            insertIndex,
            editIndex,
            customActionsStartIndex,
            customActionsIndices,
            saveEditIndex,
            discardEditIndex,
            detailsIndex,
            actionsMenuIndex,
            count: buttonIndex, // Total button count
        };
    }, [allowInsert, hasMenuActions, customActionsCount, isEditMode]);
}
