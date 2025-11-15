"use client";

import {
    GridItemHTMLElement,
    GridStack,
    GridStackNode,
    GridStackOptions,
    GridStackWidget,
} from "gridstack";
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

    const syncElementToGrid = useCallback((element: HTMLElement) => {
        try {
            if (!element) return;

            const component = element.firstElementChild as HTMLElement;
            if (!component) return;

            const desiredHeightPx = component.getBoundingClientRect().height;
            // Only skip if there's no visible content to measure
            if (desiredHeightPx === 0) return;

            const gridItem = element.closest(".grid-stack-item") as GridItemHTMLElement | null;
            if (!gridItem) return;

            // Get the individual cell height per row in the grid instance
            const node = gridItem.gridstackNode as
                | (GridStackNode & { _moving?: boolean; _resizing?: boolean })
                | undefined;
            if (!node) return;
            if (node._moving || node._resizing) return;
            const grid = node.grid;
            if (!grid) return;

            // Guard against destroyed or invalid grid instances
            if (!grid.engine || !grid.opts) return;

            const cellHeight = grid.getCellHeight(true);

            if (!cellHeight) return;

            const desiredRows = Math.max(1, Math.ceil(desiredHeightPx / cellHeight) + 1);
            if (desiredRows !== node.h) {
                // Additional safety checks before updating
                if (!gridItem.gridstackNode) return;

                // Check if node is being moved or resized (cast to access private properties)
                const nodeWithState = gridItem.gridstackNode as GridStackNode & {
                    _moving?: boolean;
                    _resizing?: boolean;
                };
                if (nodeWithState._moving || nodeWithState._resizing) return;

                // Batch the update to prevent event cascade issues
                grid.batchUpdate();
                try {
                    grid.update(gridItem, { h: desiredRows });
                } finally {
                    grid.commit();
                }
            }
        } catch (error) {
            // Silently catch errors during resize operations to prevent uncaught exceptions
            // These can occur when grids are being destroyed or reconfigured
            console.debug("Grid sync error (non-critical):", error);
        }
    }, []);

    const resizeWidgetToContent = useCallback(
        (widgetId: string) => {
            const target = widgetContainersRef.current.get(widgetId);
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
                try {
                    entries.forEach((entry) => {
                        const element = entry.target as HTMLElement;
                        const gridItem = element.closest(".grid-stack-item") as GridItemHTMLElement | null;

                        // Skip if grid is actively being resized by user
                        const nodeWithState = gridItem?.gridstackNode as
                            | (GridStackNode & { _resizing?: boolean })
                            | undefined;
                        if (nodeWithState?._resizing) return;

                        syncElementToGrid(element);
                    });
                } catch (error) {
                    // Catch any errors in the resize observer callback
                    console.debug("ResizeObserver callback error (non-critical):", error);
                }
            });

            // Wait for the next frame to ensure content is rendered
            requestAnimationFrame(() => {
                try {
                    const renderedComponent = target.firstElementChild as HTMLElement;
                    if (renderedComponent) {
                        // Observe the actual rendered component
                        observer.observe(renderedComponent);
                        resizeObserverMap.current.set(widgetId, observer);

                        // Initial sync after content is available
                        syncElementToGrid(renderedComponent);
                    }
                } catch (error) {
                    console.debug("ResizeObserver registration error (non-critical):", error);
                }
            });
        },
        [syncElementToGrid]
    );

    const ensureDomContainer = useCallback(
        (widgetId: string): HTMLElement | null => {
            if (typeof document === "undefined") return null;

            const safeId = (globalThis as any).CSS?.escape
                ? (globalThis as any).CSS.escape(widgetId)
                : widgetId;

            const gridItem = document.querySelector<HTMLElement>(`[gs-id="${safeId}"]`);
            if (!gridItem) return null;

            const contentWrapper = gridItem.querySelector<HTMLElement>(".grid-stack-item-content");
            if (!contentWrapper) return null;

            let renderRoot = contentWrapper.querySelector<HTMLElement>(".grid-render-root");
            if (!renderRoot) {
                renderRoot = contentWrapper.ownerDocument.createElement("div");
                renderRoot.className = "grid-render-root";
                renderRoot.dataset.widgetId = widgetId;
                contentWrapper.appendChild(renderRoot);
            }

            if (gridStack) {
                let containers = gridWidgetContainersMap.get(gridStack);
                if (!containers) {
                    containers = new Map<string, HTMLElement>();
                    gridWidgetContainersMap.set(gridStack, containers);
                }
                containers.set(widgetId, renderRoot);
            }

            widgetContainersRef.current.set(widgetId, renderRoot);
            registerResizeObserver(widgetId, renderRoot);
            return renderRoot;
        },
        [gridStack, registerResizeObserver]
    );

    const renderCBFn = useCallback(
        (element: HTMLElement, widget: GridStackWidget & { grid?: GridStack }) => {
            try {
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

                    // Also update the local ref for backward compatibility
                    widgetContainersRef.current.set(widget.id, renderRoot);

                    registerResizeObserver(widget.id, renderRoot);
                }
            } catch (error) {
                console.debug("Grid render callback error (non-critical):", error);
            }
        },
        [registerResizeObserver]
    );

    const resizeToContentCBFn = useCallback(
        (el: GridItemHTMLElement) => {
            try {
                if (!el) return;
                const node = el.gridstackNode;
                if (!node?.id) return;
                resizeWidgetToContent(node.id);
            } catch (error) {
                console.debug("Resize to content callback error (non-critical):", error);
            }
        },
        [resizeWidgetToContent]
    );

    const initGrid = useCallback(() => {
        if (containerRef.current) {
            // Wrap callbacks in error handlers to catch any internal GridStack errors
            GridStack.renderCB = (el: HTMLElement, widget: any) => {
                try {
                    renderCBFn(el, widget);
                } catch (error) {
                    console.debug("GridStack.renderCB error (non-critical):", error);
                }
            };

            GridStack.resizeToContentCB = (el: any) => {
                try {
                    resizeToContentCBFn(el);
                } catch (error) {
                    console.debug("GridStack.resizeToContentCB error (non-critical):", error);
                }
            };

            return GridStack.init(optionsRef.current, containerRef.current);
        }
        return null;
    }, [renderCBFn, resizeToContentCBFn]);

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
                    const resolveContainer = (
                        containers?: Map<string, HTMLElement>
                    ): HTMLElement | null => {
                        if (!containers) return null;
                        const container = containers.get(widgetId) || null;
                        if (container && !container.isConnected) {
                            containers.delete(widgetId);
                            return null;
                        }
                        return container;
                    };

                    if (gridStack) {
                        const containers = gridWidgetContainersMap.get(gridStack);
                        const container = resolveContainer(containers);
                        if (container) {
                            return container;
                        }
                    }

                    const fallback = resolveContainer(widgetContainersRef.current);
                    if (fallback) {
                        return fallback;
                    }

                    return ensureDomContainer(widgetId);
                };

                return {
                    getWidgetContainer,
                    resizeWidgetToContent,
                };
            }, [gridStack, resizeWidgetToContent, ensureDomContainer])}
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
