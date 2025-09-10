"use client";

import { Button } from "@/components/ui/button";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";

import { GridBlock } from "../blocks/grid-block";
import { SortableList } from "../blocks/sortable-wrapper";
import { createBlockTreeManager } from "../util/block-operations";
import { containerCollisionDetection } from "../util/collision";
import { DragRegistry } from "../util/registry";
import { GridBlockProps } from "../util/types";

/**
 * BlockEditorDemo - Improved drag and drop grid builder
 *
 * Features:
 * - Add different types of blocks
 * - Drag blocks onto others to create nested containers
 * - Resize containers with handles
 * - Proper validation and error handling
 * - Type-safe block data
 */

export const BlockEditorDemo = () => {
    const [blocks, setBlocks] = useState<GridBlockProps[]>([
        {
            id: "a",
            type: "displayBlock",
            data: { title: "Block A" },
        },
        {
            id: "b",
            type: "displayBlock",
            data: { title: "Block B" },
        },
        {
            id: "c",
            type: "displayBlock",
            data: { title: "Block C" },
        },
    ]);

    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [blockManager] = useState(() => createBlockTreeManager(blocks));

    // Update manager when blocks change
    blockManager.setBlocks(blocks);

    const handleAddBlock = useCallback((type: string = "displayBlock") => {
        const newBlock: GridBlockProps = {
            id: nanoid(8),
            type,
            data:
                type === "displayBlock" ? { title: `New ${type}` } : undefined,
        };
        setBlocks((prev) => [...prev, newBlock]);
    }, []);

    const handleResize = useCallback(
        (blockId: string | number, sizes: number[]) => {
            const updatedBlocks = blockManager.resizeBlock(blockId, sizes);
            setBlocks(updatedBlocks);
        },
        [blockManager]
    );

    const handleDragStart = useCallback((event: any) => {
        setActiveId(event.active.id);
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);

            if (!over || active.id === over.id) return;

            const result = blockManager.handleDragDrop(active.id, over.id);

            if (result.success) {
                setBlocks(result.blocks);
            } else {
                console.warn("Drag drop failed:", result.error);
                // You could show a toast notification here
            }
        },
        [blockManager]
    );

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    const renderDragOverlay = useCallback(() => {
        if (!activeId) return null;

        const block = blockManager.findBlock(activeId).block;
        if (!block) return null;

        const config = DragRegistry[block.type];
        if (!config?.renderOverlay) return null;

        return config.renderOverlay(block.id, block.data);
    }, [activeId, blockManager]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex gap-2">
                    <Button onClick={() => handleAddBlock("displayBlock")}>
                        Add Display Block
                    </Button>
                    <Button onClick={() => handleAddBlock("dashboardWidget")}>
                        Add Widget
                    </Button>
                    <Button onClick={() => handleAddBlock("containerBlock")}>
                        Add Container
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Drag a block onto another to create nested containers.
                    Resize using handles.
                </p>
            </div>

            <DndContext
                collisionDetection={containerCollisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableList items={blocks}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {blocks.map((block) => (
                            <GridBlock
                                key={block.id}
                                id={block.id}
                                type={block.type}
                                children={block.children}
                                sizes={block.sizes}
                                onResize={handleResize}
                                data={block.data}
                                className="min-h-[200px]"
                            />
                        ))}
                    </div>
                </SortableList>

                <DragOverlay>{renderDragOverlay()}</DragOverlay>
            </DndContext>
        </div>
    );
};
