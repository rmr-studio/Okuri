/**
 * Editor Grid Tracker
 *
 * Component that registers GridStack instances with the EditorLayoutProvider
 * to track block hierarchy in real-time.
 */
"use client";

import { useEffect } from "react";
import { useGrid } from "../../grid/provider/grid-provider";
import { useEditorLayout } from "../context/editor-layout-provider";

interface Props {
    /** The parent block ID if this is a nested grid, or null for top-level */
    parentId: string | null;
}

/**
 * Invisible component that registers the current GridStack instance
 * with the EditorLayoutProvider when it mounts.
 */
export const EditorGridTracker: React.FC<Props> = ({ parentId }) => {
    const { gridStack } = useGrid();
    const { registerGrid, unregisterGrid } = useEditorLayout();

    useEffect(() => {
        if (!gridStack) return;

        registerGrid(gridStack, parentId);

        return () => {
            unregisterGrid(gridStack);
        };
    }, [gridStack, parentId, registerGrid, unregisterGrid]);

    return null;
};
