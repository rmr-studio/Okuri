"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FC, useCallback } from "react";
import { DragRegistry } from "../util/registry";
import { SortableItem } from "./sortable-item";

export interface GridBlockProps {
    id: string | number;
    type: string;
    children?: GridBlockProps[];
    sizes?: number[]; // panel proportions (0–100)
    className?: string;
    onResize?: (id: string | number, sizes: number[]) => void;
}

/**
 * GridBlock
 *
 * - Handles both leaf and container blocks.
 * - When container, persists resizable panel sizes via `onResize`.
 */
export const GridBlock: FC<GridBlockProps> = ({
    id,
    type,
    children = [],
    sizes,
    className,
    onResize,
}) => {
    const config = DragRegistry[type];
    const isContainer = config?.behaviors?.nestable && children.length > 0;
    const isResizable = config?.behaviors?.resizable;

    const handleResize = useCallback(
        (updatedSizes: number[]) => {
            onResize?.(id, updatedSizes);
        },
        [id, onResize]
    );

    return (
        <SortableItem id={id} className="flex-1">
            {isContainer && isResizable ? (
                <ResizablePanelGroup
                    direction="horizontal"
                    className="flex w-full h-full rounded-lg border shadow-sm overflow-hidden"
                    onLayout={handleResize} // 📌 capture sizes
                >
                    {children.map((child, index) => (
                        <>
                            <ResizablePanel
                                key={child.id}
                                defaultSize={sizes?.[index] || 100 / children.length}
                                minSize={10}
                            >
                                <div className="p-4 bg-white h-full">
                                    <GridBlock
                                        key={child.id}
                                        id={child.id}
                                        type={child.type}
                                        children={child.children}
                                        sizes={child.sizes}
                                        onResize={onResize} // bubble up resize changes
                                    />
                                </div>
                            </ResizablePanel>

                            {index < children.length - 1 && <ResizableHandle withHandle />}
                        </>
                    ))}
                </ResizablePanelGroup>
            ) : (
                <div className={`p-4 bg-white rounded shadow h-full ${className || ""}`}>
                    {config?.render(id, { children }) ??
                        children.map((child) => (
                            <GridBlock
                                key={child.id}
                                id={child.id}
                                type={child.type}
                                children={child.children}
                                sizes={child.sizes}
                                onResize={onResize}
                            />
                        ))}
                </div>
            )}
        </SortableItem>
    );
};
