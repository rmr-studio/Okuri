"use client";

import { useGrid } from "@/components/feature-modules/grid/provider/grid-provider";
import { useEffect } from "react";
import { useBlockEnvironment } from "../context/block-environment-provider";

/**
 * Synchronizes BlockEnvironment state with GridStack layout changes
 *
 * This hook:
 * 1. Listens to GridStack layout events (change, dragstop, resizestop)
 * 2. Updates block layouts in BlockEnvironment when positions change
 * 3. Detects when blocks are moved between parents (nested ↔ top-level)
 * 4. Promotes blocks to top-level when dragged out of nested grids
 *
 * @param parentId - The parent block ID if this is a nested grid, null for top-level
 */
export const useEnvironmentGridSync = (parentId: string | null = null) => {
    const { gridStack } = useGrid();
    const { updateLayout, getParent, moveBlock } = useBlockEnvironment();

    useEffect(() => {
        if (!gridStack) return;

        /**
         * Handles layout changes from GridStack (drag, resize, etc.)
         */
        const handleLayoutChange = () => {
            const nodes = gridStack.engine.nodes ?? [];

            nodes.forEach((node) => {
                const blockId = String(node.id);

                // Update layout in environment
                updateLayout(blockId, {
                    x: node.x ?? 0,
                    y: node.y ?? 0,
                    w: node.w ?? 1,
                    h: node.h ?? 1,
                });
            });
        };

        /**
         * Handles blocks being dropped/moved
         * Uses moveBlock to handle all movement scenarios (promotion, demotion, relocation)
         */
        const handleBlockMoved = (event: Event, prevWidget: any, newWidget: any) => {
            // GridStack "dropped" event signature: (event, prevWidget, newWidget)
            if (!newWidget) return;

            const blockId = String(newWidget.id);
            const currentParent = getParent(blockId);

            // Determine the new parent based on the grid this hook is attached to
            // parentId is null for top-level grid, or the parent block ID for nested grids
            const newParent = parentId;

            // Check if parent changed
            if (currentParent !== newParent) {
                console.log(
                    `[GridSync] Block ${blockId} moved from parent ${currentParent} to ${newParent}`
                );

                // Use moveBlock to handle all movement logic
                moveBlock(
                    blockId,
                    newParent,
                    "main", // Default slot
                    {
                        x: newWidget.x ?? 0,
                        y: newWidget.y ?? 0,
                        w: newWidget.w ?? 1,
                        h: newWidget.h ?? 1,
                    }
                );
            }
        };

        /**
         * Handles blocks being added to grid
         * Uses moveBlock to handle the addition
         */
        const handleBlockAdded = (event: Event, items: any[]) => {
            if (!items || items.length === 0) return;

            items.forEach((item) => {
                const blockId = String(item.id);
                const currentParent = getParent(blockId);

                // If block was added to this grid and parent doesn't match
                if (currentParent !== parentId) {
                    console.log(
                        `[GridSync] Block ${blockId} added to grid with parent ${parentId}`
                    );

                    moveBlock(blockId, parentId, "main", {
                        x: item.x ?? 0,
                        y: item.y ?? 0,
                        w: item.w ?? 1,
                        h: item.h ?? 1,
                    });
                }
            });
        };

        // Register event listeners
        gridStack.on("change", handleLayoutChange);
        gridStack.on("dragstop", handleLayoutChange);
        gridStack.on("resizestop", handleLayoutChange);
        gridStack.on("dropped", handleBlockMoved);
        gridStack.on("added", handleBlockAdded);

        // Cleanup
        return () => {
            gridStack.off("change", handleLayoutChange);
            gridStack.off("dragstop", handleLayoutChange);
            gridStack.off("resizestop", handleLayoutChange);
            gridStack.off("dropped", handleBlockMoved);
            gridStack.off("added", handleBlockAdded);
        };
    }, [gridStack, parentId, updateLayout, getParent, moveBlock]);

    return null;
};
