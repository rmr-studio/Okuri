"use client";

import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { useState } from "react";
import { GridBlock, GridBlockProps } from "../blocks/grid-block";
import { SortableList } from "../blocks/sortable-wrapper";
import { DragRegistry } from "../util/registry";

export const BlockEditor = () => {
    const [blocks, setBlocks] = useState<GridBlockProps[]>([
        { id: "1", type: "displayBlock" },
        { id: "2", type: "displayBlock" },
    ]);

    const handleResize = (blockId: string | number, sizes: number[]) => {
        setBlocks((prev) =>
            prev.map((b) =>
                b.id === blockId
                    ? { ...b, sizes }
                    : {
                          ...b,
                          children: b.children?.map((c) =>
                              c.id === blockId ? { ...c, sizes } : c
                          ),
                      }
            )
        );
    };

    // 📌 Handle drag/drop + promotion into container blocks
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setBlocks((prev) => {
            const findBlock = (
                nodes: GridBlockProps[],
                id: string | number
            ): { block?: GridBlockProps; parent?: GridBlockProps; index?: number } => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === id) return { block: nodes[i], index: i };
                    if (nodes[i].children) {
                        const res = findBlock(nodes[i].children!, id);
                        if (res.block) return { ...res, parent: nodes[i] };
                    }
                }
                return {};
            };

            const source = findBlock(prev, active.id);
            const target = findBlock(prev, over.id);

            if (!source.block || !target.block) return prev;

            const targetConfig = DragRegistry[target.block.type];
            const isValidDrop =
                targetConfig?.behaviors?.nestable &&
                targetConfig?.validChildren?.includes(source.block.type);

            if (!isValidDrop) return prev;

            // ✅ Build new children
            const newChildren = [...(target.block.children || []), source.block];

            // ✅ Calculate proportional sizes
            const prevSizes =
                target.block?.sizes ||
                (target.block?.children?.map(() => 100 / (target.block?.children?.length || 1))) ||
                [];
            const oldCount = prevSizes.length;
            const newCount = newChildren.length;

            let newSizes: number[];
            if (oldCount > 0) {
                // Scale old sizes to (100 * oldCount / newCount)
                const scale = oldCount / newCount;
                const scaled = prevSizes.map((s) => s * scale);

                // Remaining space goes to the new child
                const used = scaled.reduce((a, b) => a + b, 0);
                const remainder = Math.max(0, 100 - used);

                newSizes = [...scaled, remainder];
            } else {
                // If no sizes existed, just split evenly
                newSizes = newChildren.map(() => 100 / newCount);
            }

            const promotedTarget: GridBlockProps = {
                ...target.block,
                type: "containerBlock",
                children: newChildren,
                sizes: newSizes,
            };

            // ✅ Rebuild tree
            const replaceBlock = (nodes: GridBlockProps[]): GridBlockProps[] => {
                return nodes
                    .filter((b) => b.id !== source.block!.id)
                    .map((b) =>
                        b.id === target.block!.id
                            ? promotedTarget
                            : { ...b, children: b.children ? replaceBlock(b.children) : [] }
                    );
            };

            return replaceBlock(prev);
        });
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableList items={blocks}>
                {blocks.map((block) => (
                    <GridBlock
                        key={block.id}
                        id={block.id}
                        type={block.type}
                        children={block.children}
                        sizes={block.sizes}
                        onResize={handleResize}
                        className="mb-4"
                    />
                ))}
            </SortableList>
        </DndContext>
    );
};
