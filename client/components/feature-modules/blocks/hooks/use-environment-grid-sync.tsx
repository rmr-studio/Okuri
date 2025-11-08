"use client";

import { useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import { GridItemHTMLElement, GridStack, GridStackNode } from "gridstack";
import { FC, useCallback, useLayoutEffect, useRef } from "react";
import { useBlockEnvironment } from "../context/block-environment-provider";
import { getNewParentId } from "../util/grid/grid.util";

type GridStackLike = Pick<GridStack, "on" | "off">;

export const BlockEnvironmentGridSync: FC = () => {
    useEnvironmentGridSync(null);
    return null;
};

/**
 * Synchronizes BlockEnvironment state with GridStack layout changes.
 *
 * - Updates block layouts when GridStack nodes move or resize
 * - Detects parent changes when widgets enter/leave nested grids
 */
export const useEnvironmentGridSync = (_parentId: string | null = null) => {
    const { gridStack } = useGrid();
    const { getParentId, moveBlock, isInitialized } = useBlockEnvironment();

    const listenersRef = useRef<Map<GridStackLike, () => void>>(new Map());
    const initializedRef = useRef(isInitialized);

    useLayoutEffect(() => {
        initializedRef.current = isInitialized;
    }, [isInitialized]);

    const attachListeners = useCallback(
        (grid: GridStackLike | null | undefined, root: GridStack) => {
            if (!grid || listenersRef.current.has(grid)) return;

            /**
             * This event listener will observe all layout changes (move/resize) within the grid.
             * This will only fire when a change has been committed (via the `change` event) so it won't spam updates during drag/resize.
             * @param event -> The layout change event
             * @param el -> The grid item element(s) that were changed (ie. Repositioned, Resized, etc)
             */
            const handleLayoutEvent = (_: Event, el: GridItemHTMLElement) => {
                console.log(el);
                // const nodes = collectNodesFromArgs(args);
                // processLayouts(nodes);
            };

            /**
             * This event listener will observe when a user completes a layout action (drag/resize).
             * This is to detect when a purposeful action has been made, so we can flush layout changes to the backend
             */
            const handleLayoutAction = (_: Event, _1: GridItemHTMLElement) => {};

            const handleBlockAdded = (_event: Event, items: GridStackNode[] = []) => {
                // processLayouts(items);

                if (!initializedRef.current) return;

                items.forEach((item) => {
                    if (item.id === undefined || item.id === null) return;
                    const blockId = String(item.id);
                    const currentParent = getParentId(blockId);
                    const newParent = getNewParentId(item, root);

                    if (currentParent !== newParent) {
                        moveBlock(blockId, newParent);
                    }
                });
            };

            grid.on("added", handleBlockAdded);

            listenersRef.current.set(grid, () => {
                grid.off("added");
            });
        },
        [getParentId, moveBlock]
    );

    useLayoutEffect(() => {
        if (!gridStack) return;

        attachListeners(gridStack, gridStack);

        return () => {
            listenersRef.current.forEach((cleanup) => cleanup());
            listenersRef.current.clear();
        };
    }, [gridStack, attachListeners]);

    return null;
};
