"use client";

import { GridItemHTMLElement, GridStack, GridStackOptions, GridStackWidget } from "gridstack";
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

const RENDER_META_ATTR = "data-render-meta";
const DEFAULT_RENDER_ROOT_CLASS = "grid-render-root";

const extractAttribute = (html: string, attribute: string): string | undefined => {
    const match = html.match(new RegExp(`${attribute}="([^"]*)"`, "i"));
    if (match && match[1]) {
        return match[1];
    }
    const singleMatch = html.match(new RegExp(`${attribute}='([^']*)'`, "i"));
    return singleMatch?.[1];
};

const ensureRenderRoot = (wrapper: HTMLElement, widget: GridStackWidget): HTMLElement => {
    const existingRoot =
        wrapper.querySelector<HTMLElement>(`[${RENDER_META_ATTR}]`) ??
        (wrapper.firstElementChild as HTMLElement | null);
    if (existingRoot) {
        return existingRoot;
    }

    const renderRoot = wrapper.ownerDocument.createElement("div");
    renderRoot.className = DEFAULT_RENDER_ROOT_CLASS;

    const content = widget.content;
    if (typeof content === "string") {
        const encodedMeta = extractAttribute(content, RENDER_META_ATTR);
        if (encodedMeta) {
            renderRoot.setAttribute(RENDER_META_ATTR, encodedMeta);
        }
        const className = extractAttribute(content, "class");
        if (className) {
            renderRoot.className = className;
        }
    }

    wrapper.appendChild(renderRoot);
    return renderRoot;
};

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
    const { gridStack, setGridStack, initialOptions } = useGrid();

    const widgetContainersRef = useRef<Map<string, HTMLElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<GridStackOptions>(initialOptions);
    const resizeObserverMap = useRef<Map<string, ResizeObserver>>(new Map());

    const syncElementToGrid = useCallback((element: HTMLElement, measuredHeight?: number) => {
        const gridItem = element.closest(".grid-stack-item") as GridItemHTMLElement | null;
        if (!gridItem) return;
        const node = gridItem.gridstackNode;
        if (!node) return;
        const grid = node.grid;
        if (!grid) return;
        const cellHeight = grid.getCellHeight(true);
        if (!cellHeight) return;
        const contentHeight = Math.ceil(
            typeof measuredHeight === "number"
                ? measuredHeight
                : element.getBoundingClientRect().height
        );
        const contentWrapper = element.closest(".grid-stack-item-content") as HTMLElement | null;
        const contentChrome =
            contentWrapper && contentWrapper !== element
                ? Math.max(
                      0,
                      Math.ceil(contentWrapper.getBoundingClientRect().height) - contentHeight
                  )
                : 0;
        const widgetChrome =
            contentWrapper && gridItem
                ? Math.max(
                      0,
                      Math.ceil(gridItem.getBoundingClientRect().height) -
                          Math.ceil(contentWrapper.getBoundingClientRect().height)
                  )
                : 0;
        const desiredHeightPx = contentHeight + contentChrome + widgetChrome;
        const desiredRows = Math.max(1, Math.round(desiredHeightPx / cellHeight));
        if (desiredRows !== node.h) {
            grid.update(gridItem, { h: desiredRows });
        }
    }, []);

    const resizeWidgetToContent = useCallback(
        (widgetId: string) => {
            const target = widgetContainersRef.current.get(widgetId);
            console.log(widgetId, target);
            if (!target) return;
            syncElementToGrid(target);
        },
        [syncElementToGrid]
    );

    const registerResizeObserver = useCallback(
        (widgetId: string, target: HTMLElement) => {
            if (typeof ResizeObserver === "undefined") return;

            const existing = resizeObserverMap.current.get(widgetId);
            if (existing) {
                existing.disconnect();
                resizeObserverMap.current.delete(widgetId);
            }

            const observer = new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    // Access the rendered component inside the grid item, if it has been rendered
                    const component: Element | null = entry.target.firstElementChild;
                    if (component) {
                        // Sync to the size of the rendered component
                        syncElementToGrid(component as HTMLElement, component.clientHeight);
                    } else {
                        // Fallback to syncing the grid item itself
                        syncElementToGrid(entry.target as HTMLElement, entry.contentRect.height);
                    }
                });
            });

            observer.observe(target);
            resizeObserverMap.current.set(widgetId, observer);
            syncElementToGrid(target);
        },
        [syncElementToGrid]
    );

    const renderCBFn = useCallback(
        (element: HTMLElement, widget: GridStackWidget & { grid?: GridStack }) => {
            const closestGrid = element.closest(".grid-stack") as
                | (HTMLElement & { gridstack?: GridStack })
                | null;
            const grid = widget.grid ?? closestGrid?.gridstack;
            if (widget.id && grid) {
                const contentWrapper = element.querySelector<HTMLElement>(
                    ".grid-stack-item-content"
                );
                const renderRoot = contentWrapper
                    ? ensureRenderRoot(contentWrapper, widget)
                    : element;

                // Get or create the widget container map for this grid instance
                let containers = gridWidgetContainersMap.get(grid);
                if (!containers) {
                    containers = new Map<string, HTMLElement>();
                    gridWidgetContainersMap.set(grid, containers);
                }
                containers.set(widget.id, renderRoot);

                console.log("Registered widget container", widget.id, renderRoot);
                // Also update the local ref for backward compatibility
                widgetContainersRef.current.set(widget.id, renderRoot);

                registerResizeObserver(widget.id, renderRoot);
            }
        },
        [registerResizeObserver]
    );

    const resizeToContentCBFn = useCallback(
        (el: GridItemHTMLElement) => {
            if (!el) return;
            const node = el.gridstackNode;
            console.log(node);
            if (!node?.id) return;
            resizeWidgetToContent(node.id);
        },
        [resizeWidgetToContent]
    );

    const initGrid = useCallback(() => {
        if (containerRef.current) {
            GridStack.renderCB = renderCBFn;
            return GridStack.init(optionsRef.current, containerRef.current);
        }
        return null;
    }, [renderCBFn]);

    useLayoutEffect(() => {
        if (!gridStack) return;
        if (isEqual(initialOptions, optionsRef.current)) return;

        try {
            optionsRef.current = initialOptions;

            gridStack.batchUpdate();

            if (initialOptions.margin !== undefined) {
                gridStack.margin(initialOptions.margin as number | string);
            }

            if (typeof initialOptions.column === "number") {
                gridStack.column(initialOptions.column);
            }

            if (typeof initialOptions.cellHeight === "number") {
                gridStack.cellHeight(initialOptions.cellHeight);
            } else if (typeof initialOptions.cellHeight === "string") {
                gridStack.cellHeight(initialOptions.cellHeight);
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
                const newGrid = initGrid();
                setGridStack(newGrid);
            }

            if (!GridStack.resizeToContentCB) {
                GridStack.resizeToContentCB = resizeToContentCBFn;
            }

            if (!GridStack.renderCB) {
                GridStack.renderCB = renderCBFn;
            }

            hasInitialisedRef.current = true;
        } catch (e) {
            console.error("Error initializing gridstack", e);
        }
    }, [gridStack, initGrid, renderCBFn, resizeToContentCBFn, setGridStack, initialOptions]);

    useLayoutEffect(() => {
        const observersSnapshot = resizeObserverMap.current;
        return () => {
            try {
                observersSnapshot.forEach((observer) => observer.disconnect());
                observersSnapshot.clear();
                if (gridStack) {
                    if (gridStack.opts) {
                        gridStack.destroy(false);
                    }
                    gridWidgetContainersMap.delete(gridStack);
                }
                hasInitialisedRef.current = false;
            } catch (e) {
                console.error("Error cleaning up gridstack", e);
            }
        };
    }, [gridStack, renderCBFn]);

    return (
        <GridStackRenderContext.Provider
            value={useMemo(() => {
                const getWidgetContainer = (widgetId: string) => {
                    if (gridStack) {
                        const containers = gridWidgetContainersMap.get(gridStack);
                        if (containers?.has(widgetId)) {
                            return containers.get(widgetId) || null;
                        }
                    }
                    return widgetContainersRef.current.get(widgetId) || null;
                };

                return {
                    getWidgetContainer,
                    resizeWidgetToContent,
                };
            }, [gridStack, resizeWidgetToContent])}
        >
            <div ref={containerRef}>{gridStack ? children : null}</div>
        </GridStackRenderContext.Provider>
    );
}

export const GridStackRenderContext = createContext<{
    getWidgetContainer: (widgetId: string) => HTMLElement | null;
    resizeWidgetToContent: (widgetId: string) => void;
} | null>(null);

/**
 * React hook to access the GridStack render context exposing widget container lookup.
 *
 * Returns the context object provided by GridContainerProvider, which includes
 * getWidgetContainer(widgetId: string): HTMLElement | null and
 * resizeWidgetToContent(widgetId: string): void.
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
