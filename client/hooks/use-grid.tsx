import { GridStack, GridStackOptions, GridStackWidget } from "gridstack";
import { useCallback, useEffect, useRef } from "react";

export const useGrid = (options: GridStackOptions = {}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstanceRef = useRef<GridStack | null>(null);

    const initGrid = useCallback(() => {
        if (gridRef.current && !gridInstanceRef.current) {
            gridInstanceRef.current = GridStack.addGrid(gridRef.current, options);
        }
        return gridInstanceRef.current;
    }, [options]);

    const destroyGrid = useCallback((removeDOM = true) => {
        if (gridInstanceRef.current) {
            gridInstanceRef.current.destroy(removeDOM);
            gridInstanceRef.current = null;
        }
    }, []);

    const addWidget = useCallback((widget: GridStackWidget) => {
        return gridInstanceRef.current?.addWidget(widget);
    }, []);

    const removeWidget = useCallback((el: HTMLElement | string) => {
        return gridInstanceRef.current?.removeWidget(el);
    }, []);

    const save = useCallback((saveContent: boolean = true, saveEntireGrid: boolean = true) => {
        return gridInstanceRef.current?.save(saveContent, saveEntireGrid);
    }, []);

    const load = useCallback((layout: GridStackWidget[]) => {
        return gridInstanceRef.current?.load(layout);
    }, []);

    useEffect(() => {
        return () => {
            destroyGrid();
        };
    }, [destroyGrid]);

    return {
        gridRef,
        gridInstance: gridInstanceRef.current,
        initGrid,
        destroyGrid,
        addWidget,
        removeWidget,
        save,
        load,
    };
};
