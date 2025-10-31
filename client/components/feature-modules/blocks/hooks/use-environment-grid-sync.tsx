"use client";

import { useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import { GridStackNode } from "gridstack";
import { useLayoutEffect } from "react";
import { useBlockEnvironment } from "../context/block-environment-provider";
import { getNewParentId } from "../util/grid/grid.util";

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
    const { getParent, moveBlock, environment, isInitialized } = useBlockEnvironment();

    useLayoutEffect(() => {
        if (!gridStack) return;

        /**
         * Handles layout changes from GridStack (drag, resize, etc.)
         */
        // const handleLayoutChange = (event: Event, nodes: GridStackNode[]) => {
        //     if (!nodes || nodes.length === 0) return;

        //     nodes.forEach((node) => {
        //         const blockId = String(node.id);
        //         if (!blockId) return;

        //         // Update layout when block is resized or repositioned
        //         const layout = {
        //             x: node.x ?? 0,
        //             y: node.y ?? 0,
        //             width: node.w ?? 1,
        //             height: node.h ?? 1,
        //             locked: false,
        //         };

        //         updateLayout(blockId, layout);
        //     });
        // };

        /**
         * Handles blocks being dropped/moved
         * This should only look at positional moves, as parental changes are handled in `handleBlockAdded`
         * This will detect moves within the same grid only and adjust order indexing
         
         */
        const handleBlockMoved = (
            event: Event,
            prevWidget: GridStackNode,
            newWidget: GridStackNode
        ) => {
            // Skip if environment is not initialized
            if (!isInitialized) return;
        };

        /**
         * Handles blocks being added to grid
         * This can happen when a widget is programmatically added or moved from another grid
         */
        const handleBlockAdded = (event: Event, items: GridStackNode[]) => {
            console.log("[GridSync] handleBlockAdded triggered");
            console.log("isInitialized:", isInitialized);
            console.log("environment:", environment);
            // Skip if environment is not initialized
            if (!isInitialized) return;

            if (!items || items.length === 0) return;

            items.forEach((item) => {
                if (!item.content) return;
                if (typeof item.content !== "string") {
                    return;
                }

                let payload: Record<string, unknown>;
                try {
                    payload = JSON.parse(item.content) as Record<string, unknown>;
                } catch (error) {
                    console.error("[GridSync] Failed to parse grid item content", error);
                    return;
                }

                const id = payload["blockId"];

                if (!id || typeof id !== "string") return;
                const currentParent = getParent(id);
                const newParent = getNewParentId(item, gridStack);

                // If block was added to this grid and parent doesn't match
                if (currentParent !== newParent) {
                    console.log(
                        `[GridSync] Block ${id} added to grid, updating parent to ${newParent}`
                    );

                    moveBlock(id, newParent, "main");
                }
            });
        };

        // Register event listeners
        // gridStack.on("change", handleLayoutChange);
        // gridStack.on("dragstop", handleLayoutChange);
        // gridStack.on("resizestop", handleLayoutChange);
        // gridStack.on("dropped", handleBlockMoved);
        gridStack.on("added", handleBlockAdded);

        // Cleanup
        return () => {
            gridStack.off("change");
            gridStack.off("dragstop");
            gridStack.off("resizestop");
            gridStack.off("dropped");
            gridStack.off("added");
        };
    }, [gridStack, parentId, isInitialized, getParent, moveBlock, environment]);

    return null;
};
