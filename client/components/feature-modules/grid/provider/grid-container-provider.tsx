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
            if (widget.id && widget.grid) {
                // Get or create the widget container map for this grid instance
                let containers = gridWidgetContainersMap.get(widget.grid);
                if (!containers) {
                    containers = new Map<string, HTMLElement>();
                    gridWidgetContainersMap.set(widget.grid, containers);
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
        if (!isEqual(initialOptions, optionsRef.current) && gridStack) {
            try {
                gridStack.removeAll(false);
                gridStack.destroy(false);
                widgetContainersRef.current.clear();
                // Clean up the WeakMap entry for this grid instance
                gridWidgetContainersMap.delete(gridStack);
                optionsRef.current = initialOptions;
                setGridStack(initGrid());
            } catch (e) {
                console.error("Error reinitializing gridstack", e);
            }
        }
    }, [initialOptions, gridStack, initGrid, setGridStack]);

    useLayoutEffect(() => {
        if (!gridStack) {
            try {
                setGridStack(initGrid());
            } catch (e) {
                console.error("Error initializing gridstack", e);
            }
        }
    }, [gridStack, initGrid, setGridStack]);

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

export function useContainer() {
    const context = useContext(GridStackRenderContext);
    if (!context) {
        throw new Error("useContainer must be used within a GridProvider");
    }
    return context;
}
