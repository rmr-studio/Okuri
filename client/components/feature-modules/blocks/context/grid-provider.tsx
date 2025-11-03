import type { GridStack, GridStackNode, GridStackWidget } from "gridstack";
import { createContext, FC, useCallback, useContext, useMemo, useState } from "react";
import {
    GridActionResult,
    GridEnvironment,
    GridProviderProps,
    GridstackContextValue,
} from "../interface/grid.interface";
import { WidgetRenderStructure } from "../interface/render.interface";
import { generatePath } from "../util/environment/environment.util";
import { createWidgetMetadata, init } from "../util/grid/grid.util";

export const GridStackContext = createContext<GridstackContextValue | null>(null);

/**
 * React context provider that manages a GridStack instance and widget metadata.
 *
 * Provides context values and helper actions for adding/removing widgets and sub-grids,
 * persisting layout, and accessing internal state:
 * - removeWidget(id): finds the DOM element with `gs-id` === id, removes it from GridStack
 *   (if present) and deletes its metadata from the map.
 * - saveOptions(): delegates to `gridStack.save(true, true, ...)` to capture the current layout.
 *
 * The provider initializes an internal Map of widget metadata by recursively scanning
 * `initialOptions.children` for widgets that have both `id` and `content`. It also exposes
 * internal setters via `_gridStack` and `_rawWidgetMetaMap` to allow consumers to read or
 * update the underlying GridStack instance and raw widget metadata map.
 *
 * @param initialOptions - Initial GridStackOptions used to populate the provider and to
 *   pre-seed the internal widget metadata map (recursively inspects `initialOptions.children`).
 * @param initialWidgetMap - Optional pre-built widget map containing all widgets (roots + descendants).
 *   When provided, this overrides the automatic map building from initialOptions.children.
 */
export const GridProvider: FC<GridProviderProps> = ({
    initialOptions,
    initialWidgetMap,
    children,
}) => {
    const [gridStack, setGridStack] = useState<GridStack | null>(null);
    const [environment, setEnvironment] = useState<GridEnvironment>(() =>
        init(initialOptions, initialWidgetMap)
    );
    // Track list of node IDs to help with re-renders when nodes are added/removed

    const addWidget = useCallback(
        (
            widget: GridStackWidget,
            meta: WidgetRenderStructure,
            parent?: GridStackNode
        ): GridActionResult => {
            if (!gridStack) return { success: false, node: null };
            const id = widget.id;
            if (!id) return { success: false, node: null };
            // Embeds both dedicated drag handle, and widget rendering metadata into widget

            const createdWidget: GridStackWidget = {
                ...widget,
                content: createWidgetMetadata(meta),
            };

            if (parent) {
                // If parent doesnt have necessities to support child grid item. Reject
                const parentId = parent.id;
                if (!parent.subGrid || !parentId) return { success: false, node: null };

                // Also assert we have the metadata to support linkage
                const root = environment.treeIndex.get(parentId);
                if (!root) return { success: false, node: null };

                parent.subGrid.addWidget(createdWidget);
                setEnvironment((prev) => {
                    const newTreeIndex = new Map(prev.treeIndex);
                    const newHierarchy = new Map(prev.hierarchy);
                    const newMetaMap = new Map(prev.widgetMetaMap);

                    newTreeIndex.set(id, root);
                    newHierarchy.set(id, parentId);
                    newMetaMap.set(id, widget);
                    return {
                        ...prev,
                        treeIndex: newTreeIndex,
                        widgetMetaMap: newMetaMap,
                        hierarchy: newHierarchy,
                    };
                });

                return findWidget(id);
            }

            gridStack.addWidget(widget);
            setEnvironment((prev) => {
                const newTreeIndex = new Map(prev.treeIndex);
                const newHierarchy = new Map(prev.hierarchy);
                const newMetaMap = new Map(prev.widgetMetaMap);

                newTreeIndex.set(id, id);
                newHierarchy.set(id, null);
                newMetaMap.set(id, widget);
                return {
                    ...prev,
                    treeIndex: newTreeIndex,
                    hierarchy: newHierarchy,
                    widgetMetaMap: newMetaMap,
                };
            });

            return findWidget(id);
        },
        [gridStack, environment]
    );

    const removeWidget = useCallback(
        (id: string) => {
            if (!gridStack) return;

            // Find the widget element in the DOM
            const element: HTMLElement | null = gridStack.el?.querySelector(`[gs-id='${id}']`);
            if (!element) return;

            // Also find and remove any descendant widgets
            const descendantIds = Array.from(element.querySelectorAll<HTMLElement>("[gs-id]"))
                .map((el) => el.getAttribute("gs-id"))
                .filter(Boolean) as string[];

            gridStack.removeWidget(element, true);

            // Update environment metadata
            setEnvironment((prev) => {
                const newTreeIndex = new Map(prev.treeIndex);
                const newHierarchy = new Map(prev.hierarchy);
                const newMetaMap = new Map(prev.widgetMetaMap);
                // Remove target and descendants from treeIndex and hierarchy

                newMetaMap.delete(id);
                newTreeIndex.delete(id);
                newHierarchy.delete(id);
                descendantIds.forEach((did) => {
                    newMetaMap.delete(id);
                    newTreeIndex.delete(did);
                    newHierarchy.delete(did);
                });

                return {
                    ...prev,
                    treeIndex: newTreeIndex,
                    hierarchy: newHierarchy,
                    widgetMetaMap: newMetaMap,
                };
            });
        },
        [gridStack]
    );

    function findNodeById(nodes: GridStackNode[], id: string): GridStackNode | null {
        const found = nodes.find((n) => n.id === id);
        return found ?? null;
    }

    /**
     * Provides direct navigation through the gridstack engine by first performing a bottom up
     * search via the hierarchy map to create a direct path to the target widget, then traversing
     * down the gridstack nodes to find the target widget's GridStackNode.
     */
    const findWidget = useCallback(
        (id: string): GridActionResult => {
            if (!gridStack) return { success: false, node: null };

            // Generate a queue of IDs from root to target (inclusive)
            const path = generatePath(environment, id);
            if (!path || path.length === 0) return { success: false, node: null };

            // 1) Start at the root in the top-level engine
            const rootId = path.shift()!;
            let curr = findNodeById(gridStack.engine.nodes, rootId);
            if (!curr) return { success: false, node: null };

            // Quick success if the root *is* the target
            if (curr.id === id) return { success: true, node: curr };

            // 2) Walk down through subGrids following the path
            while (path.length > 0) {
                // If we still have IDs to traverse, the current node must own a subGrid
                if (!curr.subGrid) return { success: false, node: null };

                const nextId = path.shift()!;
                const next = findNodeById(curr.subGrid.engine.nodes, nextId);
                if (!next) return { success: false, node: null };

                // Advance
                curr = next;

                // Early exit if we reached the target
                if (curr.id === id) {
                    return { success: true, node: curr };
                }
            }

            // If we consumed the path but didn't match id, something's inconsistent
            return { success: false, node: null };
        },
        [gridStack, environment]
    );

    /**
     * Checks if a widget with the given ID exists in the environments
     */
    const widgetExists = useCallback(
        (id: string) => {
            return environment.treeIndex.has(id);
        },
        [environment]
    );

    const saveOptions = useCallback(() => {
        return gridStack?.save(true, true);
    }, [gridStack]);

    return (
        <GridStackContext.Provider
            value={useMemo(
                () => ({
                    initialOptions,
                    gridStack,
                    environment,
                    setGridStack,
                    addWidget,
                    findWidget,
                    widgetExists,
                    removeWidget,
                    saveOptions,
                }),
                [initialOptions, gridStack, addWidget, removeWidget, saveOptions, environment]
            )}
        >
            {children}
        </GridStackContext.Provider>
    );
};

/**
 * Retrieves the current GridStack context value for consuming components.
 *
 * @returns The value from GridStackContext (includes initialOptions, gridStack, addWidget, removeWidget, addSubGrid, saveOptions, and internal setters).
 * @throws Error if called outside of a GridProvider (no GridStackContext is available).
 */
export function useGrid() {
    const context = useContext(GridStackContext);
    if (!context) {
        throw new Error("useGrid must be used within a GridProvider");
    }
    return context;
}
