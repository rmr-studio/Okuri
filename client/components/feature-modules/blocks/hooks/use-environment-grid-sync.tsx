"use client";

import { useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import { GridItemHTMLElement, GridStack, GridStackNode } from "gridstack";
import { FC, useCallback, useLayoutEffect, useRef } from "react";
import { useBlockEnvironment } from "../context/block-environment-provider";
import { useBlockFocus } from "../context/block-focus-provider";
import { useCommandEnvironment } from "../context/command-enabled-environment-provider";
import { useLayoutChange } from "../context/layout-change-provider";
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
    const { getParentId, isInitialized } = useBlockEnvironment();
    const { moveBlockWithCommand } = useCommandEnvironment();
    const { acquireLock, releaseLock } = useBlockFocus();
    const { trackLayoutChange, trackStructuralChange } = useLayoutChange();

    // Store widget states before drag/resize to create proper commands
    const widgetBeforeChangeRef = useRef<Map<string, GridStackNode>>(new Map());

    const listenersRef = useRef<Map<GridStackLike, () => void>>(new Map());
    const initializedRef = useRef(isInitialized);
    const gridInteractionLockRef = useRef<(() => void) | null>(null);

    useLayoutEffect(() => {
        initializedRef.current = isInitialized;
    }, [isInitialized]);

    const acquireInteractionLock = useCallback(() => {
        if (gridInteractionLockRef.current) return;

        const release = acquireLock({
            id: "grid-interaction",
            reason: "Grid interaction in progress",
            suppressHover: true,
            suppressSelection: true,
        });
        gridInteractionLockRef.current = release;
    }, [acquireLock]);

    const releaseInteractionLock = useCallback(() => {
        if (!gridInteractionLockRef.current) return;
        gridInteractionLockRef.current();
        gridInteractionLockRef.current = null;
    }, [releaseLock]);

    const attachListeners = useCallback(
        (grid: GridStackLike | null | undefined, root: GridStack) => {
            if (!grid || listenersRef.current.has(grid)) return;

            /**
             * This event listener will observe when a user starts a layout action (drag/resize).
             * Store the widget state BEFORE the change so we can create proper undo commands
             */
            const handleResourceLock = (_: Event, items: GridItemHTMLElement | GridItemHTMLElement[]) => {
                try {
                    if (!initializedRef.current) return;
                    acquireInteractionLock();

                    // Store current state of widgets being modified
                    const itemArray = Array.isArray(items) ? items : [items];
                    itemArray.forEach((item) => {
                        const el = item as GridItemHTMLElement;
                        const widgetId = el?.gridstackNode?.id;
                        if (widgetId && el.gridstackNode) {
                            widgetBeforeChangeRef.current.set(String(widgetId), {
                                ...el.gridstackNode,
                            });
                        }
                    });
                } catch (error) {
                    console.debug("Grid resize/drag start handler error (non-critical):", error);
                }
            };

            const handleResourceUnlock = (
                _: Event,
                items: GridItemHTMLElement | GridItemHTMLElement[]
            ) => {
                try {
                    if (!initializedRef.current) return;

                    const itemArray = Array.isArray(items) ? items : [items];

                    const hasActualMutation = itemArray.some((item) => {
                        const el = item as GridItemHTMLElement;
                        const node = el?.gridstackNode;
                        const widgetId = node?.id;

                        if (!node || widgetId === undefined || widgetId === null) {
                            return false;
                        }

                        const before = widgetBeforeChangeRef.current.get(String(widgetId));
                        if (!before) {
                            return false;
                        }

                        return (
                            before.x !== node.x ||
                            before.y !== node.y ||
                            before.w !== node.w ||
                            before.h !== node.h
                        );
                    });

                    if (hasActualMutation) {
                        trackLayoutChange();
                    }

                    // Clear stored widget states
                    widgetBeforeChangeRef.current.clear();

                    releaseInteractionLock();
                } catch (error) {
                    console.debug("Grid resize/drag stop handler error (non-critical):", error);
                }
            };

            const handleBlockAdded = (_event: Event, items: GridStackNode[] = []) => {
                try {
                    if (!initializedRef.current) return;

                    releaseInteractionLock();
                    items.forEach((item) => {
                        try {
                            if (!item || item.id === undefined || item.id === null) return;
                            const blockId = String(item.id);
                            const currentParent = getParentId(blockId);
                            const newParent = getNewParentId(item, root);

                            if (currentParent !== newParent) {
                                // Track structural change (re-parenting)
                                trackStructuralChange();
                                // Update BlockEnvironment with command
                                moveBlockWithCommand(blockId, newParent);
                            }
                        } catch (itemError) {
                            console.debug("Block added item handler error (non-critical):", itemError);
                        }
                    });
                } catch (error) {
                    console.debug("Block added handler error (non-critical):", error);
                }
            };

            /**
             * Handle layout changes (resize, reposition within same parent)
             * This fires when GridStack layout changes but does NOT indicate re-parenting
             */
            const handleLayoutChange = (_event: Event, items: GridStackNode[] = []) => {
                try {
                    if (!initializedRef.current) return;

                    // Check if any item changed parent (if so, skip - handleBlockAdded handles it)
                    const hasParentChange = items.some((item) => {
                        if (!item || item.id === undefined || item.id === null) return false;
                        const blockId = String(item.id);
                        const currentParent = getParentId(blockId);
                        const newParent = getNewParentId(item, root);
                        return currentParent !== newParent;
                    });

                    const isProgrammaticUpdate = widgetBeforeChangeRef.current.size === 0;

                    // Only track as layout change if no parent changes occurred
                    // (parent changes are structural and handled separately)
                    // and the update was not part of an active drag/resize (handled on unlock)
                    if (!hasParentChange && items.length > 0 && isProgrammaticUpdate) {
                        trackLayoutChange();
                    }
                } catch (error) {
                    console.debug("Layout change handler error (non-critical):", error);
                }
            };

            grid.on("added", handleBlockAdded);
            grid.on("change", handleLayoutChange);
            grid.on("dragstart", handleResourceLock);
            grid.on("resizestart", handleResourceLock);
            grid.on("dragstop", handleResourceUnlock);
            grid.on("resizestop", handleResourceUnlock);
            grid.on("dropped", handleResourceUnlock);

            listenersRef.current.set(grid, () => {
                try {
                    grid.off("added");
                    grid.off("change");
                    grid.off("dragstart");
                    grid.off("resizestart");
                    grid.off("dragstop");
                    grid.off("resizestop");
                    grid.off("dropped");
                } catch (error) {
                    console.debug("Grid event listener cleanup error (non-critical):", error);
                }
            });
        },
        [getParentId, moveBlockWithCommand, trackLayoutChange, trackStructuralChange, acquireInteractionLock, releaseInteractionLock]
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
