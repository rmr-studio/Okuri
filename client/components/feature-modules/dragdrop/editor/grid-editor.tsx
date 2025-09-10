"use client";

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    closestCenter,
} from "@dnd-kit/core";
import { useCallback, useState } from "react";
import { GridBlock } from "../blocks/grid-block";
import { SortableList } from "../blocks/sortable-wrapper";
import { createBlockTreeManager } from "../util/block-operations";
import { DragRegistry } from "../util/registry";
import { GridBlockProps } from "../util/types";

/**
 * BlockEditor - Advanced grid editor with full drag and drop support
 *
 * Features:
 * - Complete drag and drop with validation
 * - Automatic container promotion
 * - Resize handling
 * - Drag overlay support
 * - Error handling and logging
 */
export const BlockEditor = () => {
    const [blocks, setBlocks] = useState<GridBlockProps[]>([
        {
            id: "1",
            type: "displayBlock",
            data: { title: "Block 1" },
        },
        {
            id: "2",
            type: "displayBlock",
            data: { title: "Block 2" },
        },
    ]);

    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [blockManager] = useState(() => createBlockTreeManager(blocks));

    // Update manager when blocks change
    blockManager.setBlocks(blocks);

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
        <div className="p-6">
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableList items={blocks}>
                    <div className="space-y-4">
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
