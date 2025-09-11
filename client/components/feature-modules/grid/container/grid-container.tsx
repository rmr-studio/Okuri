// components/GridStackContainer.tsx
import { useGrid } from "@/hooks/use-grid";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { GridStackOptions, GridStackWidget } from "gridstack";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";

interface Props extends ClassNameProps {
    options?: GridStackOptions;
    children?: React.ReactNode;
    onSave?: (data: any) => void;
    onLoad?: () => void;
}

export interface GridStackContainerRef {
    addWidget: (widget: GridStackWidget) => void;
    removeWidget: (el: HTMLElement | string) => void;
    save: (content?: boolean, full?: boolean) => any;
    load: (layout: GridStackWidget[]) => void;
    destroy: (removeDOM?: boolean) => void;
    gridInstance: any;
}

export const GridStackContainer = forwardRef<GridStackContainerRef, Props>(
    ({ options = {}, children, className, onSave, onLoad }, ref) => {
        const {
            gridRef,
            gridInstance,
            initGrid,
            destroyGrid,
            addWidget,
            removeWidget,
            save,
            load,
        } = useGrid(options);

        useEffect(() => {
            const grid = initGrid();
            if (onLoad) onLoad();
            return () => destroyGrid();
        }, [initGrid, destroyGrid, onLoad]);

        useImperativeHandle(ref, () => ({
            addWidget,
            removeWidget,
            save: (content = true, full = true) => {
                const data = save(content, full);
                if (onSave) onSave(data);
                return data;
            },
            load,
            destroy: destroyGrid,
            gridInstance,
        }));

        return (
            <div
                ref={gridRef}
                className={cn("grid-stack-item", className)}
                style={{ minHeight: "250px" }}
            >
                {children}
            </div>
        );
    }
);

GridStackContainer.displayName = "GridStackContainer";
