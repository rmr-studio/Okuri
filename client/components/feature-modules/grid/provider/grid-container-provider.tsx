"use client";

import { GridStack, GridStackOptions, GridStackWidget } from "gridstack";
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
} from "react";
import isEqual from "react-fast-compare";
import { useGrid } from "./grid-provider";

// WeakMap to store widget containers for each grid instance
export const gridWidgetContainersMap = new WeakMap<GridStack, Map<string, HTMLElement>>();

/**
 * React provider that initializes and manages a GridStack instance and exposes
 * a lookup API for widget container elements.
 *
 * Initializes GridStack on an internal container element, registers a render
 * callback that records each widget's DOM container into a per-grid WeakMap
 * (gridWidgetContainersMap) and a local fallback map, and reinitializes the
 * GridStack instance when the provider's initial options change. Cleans up
 * GridStack and the per-grid map on unmount and restores the render callback
 * if it was set by this provider.
 *
 * The provider value exposes getWidgetContainer(widgetId) => HTMLElement | null,
 * which first looks up the container for the current GridStack instance and
 * falls back to a local map for backward compatibility.
 *
 * @returns A React element wrapping children with GridStackRenderContext.
 */
export function GridContainerProvider({ children }: PropsWithChildren) {
    const {
        _gridStack: { value: gridStack, set: setGridStack },
        initialOptions,
    } = useGrid();

    const widgetContainersRef = useRef<Map<string, HTMLElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<GridStackOptions>(initialOptions);

    const renderCBFn = useCallback(
        (element: HTMLElement, widget: GridStackWidget & { grid?: GridStack }) => {
            const grid =
                widget.grid ||
                ((element.closest(".grid-stack") as any)?.gridstack as GridStack | undefined);
            if (widget.id && grid) {
                // Get or create the widget container map for this grid instance
                let containers = gridWidgetContainersMap.get(grid);
                if (!containers) {
                    containers = new Map<string, HTMLElement>();
                    gridWidgetContainersMap.set(grid, containers);
                }
                containers.set(widget.id, element);

                // Also update the local ref for backward compatibility
                widgetContainersRef.current.set(widget.id, element);
            }
        },
        []
    );

    const initGrid = useCallback(() => {
        if (containerRef.current) {
            GridStack.renderCB = renderCBFn;
            return GridStack.init(optionsRef.current, containerRef.current);
            // ! Change event not firing on nested grids (resize, move...) https://github.com/gridstack/gridstack.js/issues/2671
            // .on("change", () => {
            //   console.log("changed");
            // })
            // .on("resize", () => {
            //   console.log("resize");
            // })
        }
        return null;
    }, [renderCBFn]);

    useLayoutEffect(() => {
        if (!gridStack) return;
        if (isEqual(initialOptions, optionsRef.current)) return;

        try {
            optionsRef.current = initialOptions;

            gridStack.batchUpdate();

            if (typeof initialOptions.margin === "number") {
                gridStack.margin(initialOptions.margin);
            }

            if (typeof initialOptions.column === "number") {
                gridStack.column(initialOptions.column);
            }

            if (initialOptions.cellHeight !== undefined) {
                gridStack.cellHeight(initialOptions.cellHeight as any);
            }

            if (Array.isArray(initialOptions.children)) {
                gridStack.removeAll(false);
                widgetContainersRef.current.clear();
                gridWidgetContainersMap.set(gridStack, new Map());
                gridStack.load(initialOptions.children);
            }

            gridStack.commit();
        } catch (e) {
            console.error("Error updating gridstack options", e);
        }
    }, [initialOptions, gridStack]);

    const hasInitialisedRef = useRef(false);

    useLayoutEffect(() => {
        if (hasInitialisedRef.current) return;

        try {
            if (!gridStack) {
                setGridStack(initGrid());
            }
            if (!GridStack.renderCB) {
                GridStack.renderCB = renderCBFn;
            }
            hasInitialisedRef.current = true;
        } catch (e) {
            console.error("Error initializing gridstack", e);
        }
    }, [gridStack, initGrid, renderCBFn, setGridStack]);

    useLayoutEffect(() => {
        return () => {
            try {
                if (gridStack) {
                    if (gridStack.opts) {
                        gridStack.destroy(false);
                    }
                    gridWidgetContainersMap.delete(gridStack);
                }
                hasInitialisedRef.current = false;
                if (GridStack.renderCB === renderCBFn) {
                    // best-effort restore
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    GridStack.renderCB = undefined;
                }
            } catch (e) {
                console.error("Error cleaning up gridstack", e);
            }
        };
    }, [gridStack, renderCBFn]);

    return (
        <GridStackRenderContext.Provider
            value={useMemo(
                () => ({
                    getWidgetContainer: (widgetId: string) => {
                        // First try to get from the current grid instance's map
                        if (gridStack) {
                            const containers = gridWidgetContainersMap.get(gridStack);
                            if (containers?.has(widgetId)) {
                                return containers.get(widgetId) || null;
                            }
                        }
                        // Fallback to local ref for backward compatibility
                        return widgetContainersRef.current.get(widgetId) || null;
                    },
                }),
                // ! gridStack is required to reinitialize the grid when the options change
                // eslint-disable-next-line react-hooks/exhaustive-deps
                [gridStack]
            )}
        >
            <div ref={containerRef}>{gridStack ? children : null}</div>
        </GridStackRenderContext.Provider>
    );
}

export const GridStackRenderContext = createContext<{
    getWidgetContainer: (widgetId: string) => HTMLElement | null;
} | null>(null);

/**
 * React hook to access the GridStack render context exposing widget container lookup.
 *
 * Returns the context object provided by GridContainerProvider, which includes
 * getWidgetContainer(widgetId: string): HTMLElement | null.
 *
 * @returns The GridStack render context with `getWidgetContainer`.
 *
 * @throws Error if called outside of a GridContainerProvider.
 */
export function useContainer() {
    const context = useContext(GridStackRenderContext);
    if (!context) {
        throw new Error("useContainer must be used within a GridProvider");
    }
    return context;
}
