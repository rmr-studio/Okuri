"use client";

import { useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import { GridRect } from "@/lib/interfaces/common.interface";
import { GridStack, GridStackNode } from "gridstack";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useBlockEnvironment } from "../context/block-environment-provider";
import { getNewParentId } from "../util/grid/grid.util";

type GridStackLike = Pick<GridStack, "on" | "off">;

const nodeToLayout = (node: GridStackNode): GridRect => ({
    x: node.x ?? 0,
    y: node.y ?? 0,
    width: node.w ?? (node as unknown as { width?: number }).width ?? 1,
    height: node.h ?? (node as unknown as { height?: number }).height ?? 1,
    locked: node.locked ?? false,
});

const collectNodesFromArgs = (args: unknown[]): GridStackNode[] => {
    const collected: GridStackNode[] = [];

    const pushNode = (candidate: GridStackNode | undefined | null) => {
        if (!candidate || candidate.id === undefined || candidate.id === null) return;
        collected.push(candidate);
    };

    args.forEach((arg) => {
        if (!arg) return;
        if (Array.isArray(arg)) {
            arg.forEach((item) => pushNode(item as GridStackNode));
            return;
        }
        if (typeof arg === "object") {
            const withNode = arg as { gridstackNode?: GridStackNode };
            if (withNode.gridstackNode) {
                pushNode(withNode.gridstackNode);
                return;
            }
            pushNode(arg as GridStackNode);
        }
    });

    return collected;
};

/**
 * Synchronizes BlockEnvironment state with GridStack layout changes.
 *
 * - Updates block layouts when GridStack nodes move or resize
 * - Detects parent changes when widgets enter/leave nested grids
 */
export const useEnvironmentGridSync = (_parentId: string | null = null) => {
    const { gridStack } = useGrid();
    const { getParentId, moveBlock, updateLayouts, isInitialized } = useBlockEnvironment();

    const listenersRef = useRef<Map<GridStackLike, () => void>>(new Map());
    const initializedRef = useRef(isInitialized);
    const hoverIntentRef = useRef<
        Map<
            GridStackLike,
            {
                timer: number | null;
                node: GridStackNode | null;
                active: boolean;
            }
        >
    >(new Map());

    useLayoutEffect(() => {
        initializedRef.current = isInitialized;
    }, [isInitialized]);

    const processLayouts = useCallback(
        (nodes: GridStackNode[]) => {
            if (!nodes || nodes.length === 0) return;

            const updates: Record<string, GridRect> = {};

            nodes.forEach((node) => {
                if (node.id === undefined || node.id === null) return;
                updates[String(node.id)] = nodeToLayout(node);
            });

            if (Object.keys(updates).length > 0) {
                updateLayouts(updates);
            }
        },
        [updateLayouts]
    );

    const clearHoverState = useCallback((grid: GridStackLike) => {
        const state = hoverIntentRef.current.get(grid);
        if (!state) return;
        if (state.timer !== null) {
            window.clearTimeout(state.timer);
        }
        state.timer = null;
        state.node = null;
        state.active = false;
        const gs = grid as GridStack & {
            placeholder?: { remove?: () => void };
        };
        gs.placeholder?.remove?.();
    }, []);

    const attachListeners = useCallback(
        (grid: GridStackLike | null | undefined, root: GridStack) => {
            if (!grid || listenersRef.current.has(grid)) return;

            const handleLayoutEvent = (...args: unknown[]) => {
                const nodes = collectNodesFromArgs(args);
                processLayouts(nodes);
            };

            const handleBlockAdded = (_event: Event, items: GridStackNode[] = []) => {
                processLayouts(items);

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

            // const handleDragStop = (_event: Event, node: GridStackNode) => {
            //     if (node?.grid) {
            //         clearHoverState(node.grid);
            //     }
            // };

            grid.on("change", handleLayoutEvent);
            grid.on("dragstop", handleLayoutEvent);
            grid.on("resizestop", handleLayoutEvent);
            grid.on("dropped", handleLayoutEvent);
            grid.on("added", handleBlockAdded);

            // grid.on("dragstop", handleDragStop);

            listenersRef.current.set(grid, () => {
                grid.off("change", handleLayoutEvent);
                grid.off("dragstop", handleLayoutEvent);
                grid.off("resizestop", handleLayoutEvent);
                grid.off("dropped", handleLayoutEvent);
                grid.off("added", handleBlockAdded);

                // grid.off("dragstop", handleDragStop);
            });
        },
        [getParentId, moveBlock, processLayouts, clearHoverState]
    );

    useLayoutEffect(() => {
        if (!gridStack) return;

        attachListeners(gridStack, gridStack);

        return () => {
            listenersRef.current.forEach((cleanup) => cleanup());
            listenersRef.current.clear();
            hoverIntentRef.current.clear();
        };
    }, [gridStack, attachListeners]);

    return null;
};
