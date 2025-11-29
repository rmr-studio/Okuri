"use client";

import React, { createContext, useContext, useMemo } from "react";

/**
 * PanelWrapperContext - Eliminates prop drilling between PanelWrapper and PanelToolbar
 *
 * Purpose: Addresses TODO on panel-wrapper.tsx line 65:
 * "todo: Move alot of this wrapper state into a context provider to reduce prop drilling"
 *
 * Pattern: Follows BlockEditProvider pattern (context + provider + custom hook)
 *
 * Benefits:
 * - Reduces PanelToolbar props from 35+ to ~5
 * - Shared state management for menus/modals
 * - Easier to add new features without prop drilling
 */
export interface PanelWrapperContextValue {
    // Block identity
    id: string;

    // Menu/modal state
    isSlashOpen: boolean;
    setSlashOpen: (open: boolean) => void;
    isQuickOpen: boolean;
    setQuickOpen: (open: boolean) => void;
    isInlineMenuOpen: boolean;
    setInlineMenuOpen: (open: boolean) => void;
    isDetailsOpen: boolean;
    setDetailsOpen: (open: boolean) => void;
    isActionsOpen: boolean;
    setActionsOpen: (open: boolean) => void;

    // Title management
    draftTitle: string;
    setDraftTitle: (title: string) => void;
    onTitleChange?: (value: string) => void;
    titlePlaceholder: string;

    // Insert context
    insertContext: "nested" | "sibling";
    setInsertContext: (context: "nested" | "sibling") => void;

    // Toolbar state
    toolbarFocusIndex: number;
    setToolbarFocusIndex: (index: number | ((prev: number) => number)) => void;

    // Configuration
    allowInsert: boolean;
    hasMenuActions: boolean;
    description?: string;

    // Derived state
    shouldHighlight: boolean;

    // Edit mode state
    isEditMode: boolean;
    hasChildren: boolean;
}

const PanelWrapperContext = createContext<PanelWrapperContextValue | null>(null);

/**
 * PanelWrapperProvider - Internal provider component
 *
 * Note: This provider wraps PanelWrapper's internal JSX (not exported as a separate component)
 * Pattern: Similar to how RenderElementProvider wraps content internally
 */
export const PanelWrapperProvider: React.FC<{
    value: PanelWrapperContextValue;
    children: React.ReactNode;
}> = ({ value, children }) => {
    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => value,
        [
            value.id,
            value.isSlashOpen,
            value.setSlashOpen,
            value.isQuickOpen,
            value.setQuickOpen,
            value.isInlineMenuOpen,
            value.setInlineMenuOpen,
            value.isDetailsOpen,
            value.setDetailsOpen,
            value.isActionsOpen,
            value.setActionsOpen,
            value.draftTitle,
            value.setDraftTitle,
            value.onTitleChange,
            value.titlePlaceholder,
            value.insertContext,
            value.setInsertContext,
            value.toolbarFocusIndex,
            value.setToolbarFocusIndex,
            value.allowInsert,
            value.hasMenuActions,
            value.description,
            value.shouldHighlight,
            value.isEditMode,
            value.hasChildren,
        ]
    );

    return (
        <PanelWrapperContext.Provider value={contextValue}>
            {children}
        </PanelWrapperContext.Provider>
    );
};

/**
 * usePanelWrapperContext - Hook to consume PanelWrapperContext
 *
 * Usage: const { draftTitle, setDraftTitle, ... } = usePanelWrapperContext();
 *
 * Throws error if used outside PanelWrapperProvider (follows established pattern)
 */
export function usePanelWrapperContext(): PanelWrapperContextValue {
    const context = useContext(PanelWrapperContext);
    if (!context) {
        throw new Error("usePanelWrapperContext must be used within PanelWrapperProvider");
    }
    return context;
}
