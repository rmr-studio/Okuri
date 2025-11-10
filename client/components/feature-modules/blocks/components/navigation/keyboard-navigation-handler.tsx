"use client";

import { useEffect } from "react";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useBlockFocus } from "../../context/block-focus-provider";
import { useGrid } from "../../context/grid-provider";
import {
    getBlockToLeft,
    getBlockToRight,
    getNextInTree,
    getPreviousInTree,
} from "../../util/navigation/keyboard-navigation.util";

/**
 * Handles keyboard navigation for focused blocks.
 * Must be rendered inside GridProvider to access grid context.
 */
export const KeyboardNavigationHandler: React.FC = () => {
    const { state, focusSurface } = useBlockFocus();
    const blockEnvironment = useBlockEnvironment();
    const gridContext = useGrid();

    useEffect(() => {
        if (typeof window === "undefined") return;
        const controller = new AbortController();
        const { signal } = controller;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if user is typing in a form element
            const activeElement = document.activeElement as HTMLElement | null;
            const isFormElement = activeElement && (
                activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA" ||
                activeElement.isContentEditable
            );

            // Skip navigation if typing in a form
            if (isFormElement) return;

            // Get current focus
            const currentFocusId = state.primaryFocusId;
            if (!currentFocusId) return;

            // Create navigation context
            const navContext = {
                getBlock: blockEnvironment.getBlock,
                getParentId: blockEnvironment.getParentId,
                getChildren: blockEnvironment.getChildren,
                getTrees: blockEnvironment.getTrees,
                findWidget: gridContext.findWidget,
            };

            let nextId: string | null = null;

            // Handle Tab / Shift+Tab (and Arrow Up/Down)
            if (event.key === "Tab") {
                event.preventDefault();

                if (event.shiftKey) {
                    // Shift+Tab = Previous (same as Arrow Up)
                    nextId = getPreviousInTree(currentFocusId, navContext);
                } else {
                    // Tab = Next (same as Arrow Down)
                    nextId = getNextInTree(currentFocusId, navContext);
                }
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                nextId = getNextInTree(currentFocusId, navContext);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                nextId = getPreviousInTree(currentFocusId, navContext);
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                nextId = getBlockToLeft(currentFocusId, navContext);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                nextId = getBlockToRight(currentFocusId, navContext);
            }

            // Focus the next block if found
            if (nextId) {
                focusSurface(nextId, { emitStackEntry: true });
            }
        };

        window.addEventListener("keydown", handleKeyDown, { signal });

        return () => controller.abort();
    }, [state.primaryFocusId, blockEnvironment, gridContext, focusSurface]);

    return null;
};
