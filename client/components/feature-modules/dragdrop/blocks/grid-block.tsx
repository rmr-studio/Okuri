"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FC, useCallback, useMemo } from "react";
import { DragRegistry } from "../util/registry";
import { BlockDirection, GridBlockProps } from "../util/types";
import { SortableItem } from "./sortable-item";

/**
 * GridBlock - Unified component for rendering all block types
 *
 * Features:
 * - Handles both leaf and container blocks
 * - Proper resizing with size persistence
 * - Drag and drop support
 * - Type-safe data handling
 * - Proper container detection and rendering
 */
export const GridBlock: FC<GridBlockProps> = ({
    id,
    type,
    children = [],
    sizes,
    className,
    onResize,
    data,
}) => {
    const config = DragRegistry[type];

    if (!config) {
        console.warn(`GridBlock: Unknown block type "${type}" not found in DragRegistry`);
        return (
            <div className="p-4 bg-red-100 border border-red-300 rounded">
                <p className="text-red-600">Unknown block type: {type}</p>
            </div>
        );
    }

    // Determine if this is a container block
    const isContainer = config.behaviors?.nestable && children.length > 0;
    const isResizable = config.behaviors?.resizable;
    const direction = (config.direction || "row") as BlockDirection;

    // Calculate default sizes if not provided
    const defaultSizes = useMemo(() => {
        if (sizes && sizes.length === children.length) {
            return sizes;
        }
        return children.map(() => 100 / children.length);
    }, [sizes, children.length]);

    const handleResize = useCallback(
        (updatedSizes: number[]) => {
            onResize?.(id, updatedSizes);
        },
        [id, onResize]
    );

    // Render container blocks with resizable panels
    if (isContainer && isResizable) {
        return (
            <SortableItem id={id} className="flex-1 min-h-[200px]">
                <ResizablePanelGroup
                    direction={direction === "row" ? "horizontal" : "vertical"}
                    className="flex w-full h-full rounded-lg border shadow-sm overflow-hidden bg-gray-50"
                    onLayout={handleResize}
                >
                    {children.map((child, index) => (
                        <div key={child.id}>
                            <ResizablePanel
                                defaultSize={defaultSizes[index]}
                                minSize={10}
                                className="relative"
                            >
                                <div className="p-2 h-full">
                                    <GridBlock
                                        id={child.id}
                                        type={child.type}
                                        children={child.children}
                                        sizes={child.sizes}
                                        onResize={onResize}
                                        data={child.data}
                                        className={child.className}
                                    />
                                </div>
                            </ResizablePanel>
                            {index < children.length - 1 && (
                                <ResizableHandle
                                    withHandle
                                    className="bg-gray-300 hover:bg-gray-400"
                                />
                            )}
                        </div>
                    ))}
                </ResizablePanelGroup>
            </SortableItem>
        );
    }

    // Render leaf blocks or non-resizable containers
    return (
        <SortableItem id={id} className="flex-1">
            <div className={`p-4 bg-card rounded-lg shadow-sm border h-full ${className || ""}`}>
                {config.render ? (
                    config.render(id, data)
                ) : (
                    <div className="text-gray-500 text-sm">
                        {config.label} - No render function defined
                    </div>
                )}

                {/* Render children for non-resizable containers */}
                {children.length > 0 && !isResizable && (
                    <div
                        className={`mt-4 flex gap-2 ${
                            direction === "column" ? "flex-col" : "flex-row"
                        }`}
                    >
                        {children.map((child) => (
                            <GridBlock
                                key={child.id}
                                id={child.id}
                                type={child.type}
                                children={child.children}
                                sizes={child.sizes}
                                onResize={onResize}
                                data={child.data}
                                className={child.className}
                            />
                        ))}
                    </div>
                )}
            </div>
        </SortableItem>
    );
};
