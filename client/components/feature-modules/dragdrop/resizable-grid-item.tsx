"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FC, ReactNode } from "react";
import { SortableItem } from "./sortable-item";

export interface GridBlockProps {
    id: string | number;
    /** Content inside the block */
    children: ReactNode;
    /** Initial size (in %) */
    initialSize?: number;
    className?: string;
}

/**
 * GridBlock
 *
 * A sortable + resizable block.
 * - Uses dnd-kit for drag & drop
 * - Uses shadcn Resizable for resizing
 *
 * Example usage:
 * ```tsx
 * <GridBlock id="1" initialSize={50}>
 *   <YourComponent />
 * </GridBlock>
 * ```
 */
export const GridBlock: FC<GridBlockProps> = ({ id, children, initialSize = 50, className }) => {
    return (
        <SortableItem id={id} className="flex-1">
            <ResizablePanelGroup
                direction="horizontal"
                className="flex w-full h-full rounded-lg border shadow-sm overflow-hidden"
            >
                <ResizablePanel defaultSize={initialSize} minSize={20} maxSize={80}>
                    <div className={`p-4 bg-white h-full ${className || ""}`}>{children}</div>
                </ResizablePanel>

                {/* Handle for resizing horizontally */}
                <ResizableHandle withHandle />

                {/* Optional: second panel to allow two blocks side by side */}
                <ResizablePanel defaultSize={100 - initialSize}>
                    <div className="p-4 bg-gray-50 h-full flex items-center justify-center text-sm text-muted-foreground">
                        Drop another block here
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </SortableItem>
    );
};
