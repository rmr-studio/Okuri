import type { GridStack, GridStackOptions, GridStackWidget } from "gridstack";
import {
    createContext,
    Dispatch,
    type PropsWithChildren,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export const GridStackContext = createContext<{
    initialOptions: GridStackOptions;
    gridStack: GridStack | null;
    addWidget: (fn: (id: string) => Omit<GridStackWidget, "id">) => void;
    removeWidget: (id: string) => void;
    addSubGrid: (
        fn: (
            id: string,
            withWidget: (w: Omit<GridStackWidget, "id">) => GridStackWidget
        ) => Omit<GridStackWidget, "id">
    ) => void;
    saveOptions: () => GridStackOptions | GridStackWidget[] | undefined;

    _gridStack: {
        value: GridStack | null;
        set: Dispatch<SetStateAction<GridStack | null>>;
    };
    _rawWidgetMetaMap: {
        value: Map<string, GridStackWidget>;
        set: Dispatch<SetStateAction<Map<string, GridStackWidget>>>;
    };
} | null>(null);

/**
 * React context provider that manages a GridStack instance and widget metadata.
 *
 * Provides context values and helper actions for adding/removing widgets and sub-grids,
 * persisting layout, and accessing internal state:
 * - addWidget(fn): generates a unique widget id, calls `fn(id)` to obtain widget data,
 *   adds it to the GridStack (if mounted) and updates the internal widget meta map.
 * - addSubGrid(fn): generates a unique sub-grid id, lets `fn` create the sub-grid widget
 *   and its children via a `withWidget` helper (which assigns unique ids for each child),
 *   adds the sub-grid to GridStack and merges created child metadata into the map.
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
 */
export function GridProvider({
    children,
    initialOptions,
}: PropsWithChildren<{ initialOptions: GridStackOptions }>) {
    const [gridStack, setGridStack] = useState<GridStack | null>(null);
    const buildRawWidgetMetaMap = useCallback(() => {
        const map = new Map<string, GridStackWidget>();
        const deepFindNodeWithContent = (obj: GridStackWidget) => {
            if (obj.id && obj.content) {
                map.set(obj.id, obj);
            }
            if (obj.subGridOpts?.children) {
                obj.subGridOpts.children.forEach((child: GridStackWidget) => {
                    deepFindNodeWithContent(child);
                });
            }
        };
        initialOptions.children?.forEach((child: GridStackWidget) => {
            deepFindNodeWithContent(child);
        });
        return map;
    }, [initialOptions]);

    const [rawWidgetMetaMap, setRawWidgetMetaMap] = useState<Map<string, GridStackWidget>>(() =>
        buildRawWidgetMetaMap()
    );
    useEffect(() => {
        setRawWidgetMetaMap(buildRawWidgetMetaMap());
    }, [buildRawWidgetMetaMap]);

    const addWidget = useCallback(
        (fn: (id: string) => Omit<GridStackWidget, "id">) => {
            const newId = `widget-${Math.random().toString(36).substring(2, 15)}`;
            const widget = fn(newId);
            gridStack?.addWidget({ ...widget, id: newId });
            setRawWidgetMetaMap((prev) => {
                const newMap = new Map<string, GridStackWidget>(prev);
                newMap.set(newId, { ...widget, id: newId });
                return newMap;
            });
        },
        [gridStack]
    );

    const addSubGrid = useCallback(
        (
            fn: (
                id: string,
                withWidget: (w: Omit<GridStackWidget, "id">) => GridStackWidget
            ) => Omit<GridStackWidget, "id">
        ) => {
            const newId = `sub-grid-${Math.random().toString(36).substring(2, 15)}`;
            const subWidgetIdMap = new Map<string, GridStackWidget>();

            const widget = fn(newId, (w) => {
                const subWidgetId = `widget-${Math.random().toString(36).substring(2, 15)}`;
                const withId = { ...w, id: subWidgetId };
                subWidgetIdMap.set(subWidgetId, withId);
                return withId;
            });

            gridStack?.addWidget({ ...widget, id: newId });

            setRawWidgetMetaMap((prev) => {
                const newMap = new Map<string, GridStackWidget>(prev);
                subWidgetIdMap.forEach((meta, id) => {
                    newMap.set(id, meta);
                });
                return newMap;
            });
        },
        [gridStack]
    );

    const removeWidget = useCallback(
        (id: string) => {
            if (!gridStack) return;
            const element: HTMLElement | null = gridStack.el?.querySelector(`[gs-id='${id}']`);
            if (!element) return;

            gridStack.removeWidget(element, true);

            setRawWidgetMetaMap((prev) => {
                const newMap = new Map<string, GridStackWidget>(prev);
                newMap.delete(id);
                return newMap;
            });
        },
        [gridStack]
    );

    const saveOptions = useCallback(() => {
        return gridStack?.save(true, true, (_, widget) => widget);
    }, [gridStack]);

    return (
        <GridStackContext.Provider
            value={useMemo(
                () => ({
                    initialOptions,
                    gridStack,
                    addWidget,
                    removeWidget,
                    addSubGrid,
                    saveOptions,
                    _gridStack: {
                        value: gridStack,
                        set: setGridStack,
                    },
                    _rawWidgetMetaMap: {
                        value: rawWidgetMetaMap,
                        set: setRawWidgetMetaMap,
                    },
                }),
                [
                    initialOptions,
                    gridStack,
                    addWidget,
                    removeWidget,
                    addSubGrid,
                    saveOptions,
                    rawWidgetMetaMap,
                ]
            )}
        >
            {children}
        </GridStackContext.Provider>
    );
}

/**
 * Retrieves the current GridStack context value for consuming components.
 *
 * @returns The value from GridStackContext (includes initialOptions, gridStack, addWidget, removeWidget, addSubGrid, saveOptions, and internal setters).
 * @throws Error if called outside of a GridProvider (no GridStackContext is available).
 */
export function useGrid() {
    const context = useContext(GridStackContext);
    if (!context) {
        throw new Error("useGrid must be used within a GridStackProvider");
    }
    return context;
}
