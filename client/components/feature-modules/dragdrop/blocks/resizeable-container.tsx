"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import React from "react";
import { DragRegistry } from "../util/registry";
import { GridBlockProps } from "./grid-block";

export const ResizableContainer: React.FC<{
    block: GridBlockProps;
    onResize: (id: string | number, sizes: number[]) => void;
}> = ({ block, onResize }) => {
    const children = block.children ?? [];
    if (!children.length) return null;

    const orientation = (block.direction ?? "row") === "column" ? "vertical" : "horizontal";
    const sizes = block.sizes ?? Array(children.length).fill(100 / children.length);

    return (
        <ResizablePanelGroup
            direction={orientation}
            className="w-full h-full rounded-lg border shadow-sm overflow-hidden"
            onLayout={(newSizes) => onResize(block.id, newSizes)}
        >
            {children.map((child, i) => (
                <React.Fragment key={child.id}>
                    <ResizablePanel defaultSize={sizes[i]} minSize={10}>
                        <div className="p-3 h-full">
                            {child.children?.length ? (
                                <ResizableContainer block={child} onResize={onResize} />
                            ) : DragRegistry[child.type]?.render ? (
                                DragRegistry[child.type]!.render!(child.id, child) // ✅ pass (id, data)
                            ) : (
                                <div className="p-3 bg-white rounded border">Item {child.id}</div>
                            )}
                        </div>
                    </ResizablePanel>
                    {i < children.length - 1 && <ResizableHandle withHandle />}
                </React.Fragment>
            ))}
        </ResizablePanelGroup>
    );
};
