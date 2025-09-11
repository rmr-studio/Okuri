import { ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { GridStackOptions } from "gridstack";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { GridStackContainer, GridStackContainerRef } from "./grid-container";

interface Props extends ClassNameProps {
    parentWidget?: any;
    subGridOptions?: GridStackOptions;
    children?: React.ReactNode;
}

export const NestedGridStack = forwardRef<GridStackContainerRef, Props>(
    ({ parentWidget, subGridOptions = {}, className, children }, ref) => {
        const gridRef = useRef<GridStackContainerRef>(null);

        useImperativeHandle(ref, () => ({
            addWidget: (widget) => gridRef.current?.addWidget(widget),
            removeWidget: (el) => gridRef.current?.removeWidget(el),
            save: (content, full) => gridRef.current?.save(content, full),
            load: (layout) => gridRef.current?.load(layout),
            destroy: (removeDOM) => gridRef.current?.destroy(removeDOM),
            gridInstance: gridRef.current?.gridInstance,
        }));

        const defaultSubGridOptions: GridStackOptions = {
            cellHeight: 50,
            column: "auto",
            acceptWidgets: true,
            margin: 5,
            subGridDynamic: true,
            ...subGridOptions,
        };

        return (
            <GridStackContainer
                ref={gridRef}
                options={defaultSubGridOptions}
                className={cn("grid-stack-nested", className)}
            >
                {children}
            </GridStackContainer>
        );
    }
);

NestedGridStack.displayName = "NestedGridStack";
