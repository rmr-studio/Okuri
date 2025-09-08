// demo/DemoGridBuilder.tsx
"use client";

import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import React, { useState } from "react";
import { GridBlockProps } from "../blocks/grid-block";
import { ResizableContainer } from "../blocks/resizeable-container";
import { SortableItem } from "../blocks/sortable-item";
import { SortableList } from "../blocks/sortable-wrapper";
import { DragRegistry } from "../util/registry";

const LeafBlock: React.FC<{ block: GridBlockProps }> = ({ block }) => {
    const def = DragRegistry[block.type];
    return (
        <div className="p-4 bg-white rounded border shadow-sm">
            {def?.render ? def.render(block.id, block) : `Item ${block.id}`}
        </div>
    );
};

export const DemoGridBuilder: React.FC = () => {
    const [blocks, setBlocks] = useState<GridBlockProps[]>([
        { id: "A", type: "displayBlock" },
        { id: "B", type: "displayBlock" },
        { id: "C", type: "displayBlock" },
    ]);

    // Resize persistence
    const handleResize = (blockId: string | number, sizes: number[]) => {
        const updateSizes = (nodes: GridBlockProps[]): GridBlockProps[] =>
            nodes.map((n) =>
                n.id === blockId
                    ? { ...n, sizes }
                    : n.children
                    ? { ...n, children: updateSizes(n.children) }
                    : n
            );

        setBlocks((prev) => updateSizes(prev));
    };

    // Find a block & its parent recursively
    const findBlock = (
        nodes: GridBlockProps[],
        id: string | number
    ): { block?: GridBlockProps; parent?: GridBlockProps } => {
        for (const n of nodes) {
            if (n.id === id) return { block: n };
            if (n.children && n.children.length) {
                const res = findBlock(n.children, id);
                if (res.block) return { ...res, parent: n };
            }
        }
        return {};
    };

    // Replace tree while removing a node (by id) wherever it is
    const removeNode = (nodes: GridBlockProps[], id: string | number): GridBlockProps[] =>
        nodes
            .filter((n) => n.id !== id)
            .map((n) => (n.children?.length ? { ...n, children: removeNode(n.children, id) } : n));

    // Replace a node (by id) with a new value
    const replaceNode = (
        nodes: GridBlockProps[],
        id: string | number,
        replacement: GridBlockProps
    ): GridBlockProps[] =>
        nodes.map((n) =>
            n.id === id
                ? replacement
                : n.children?.length
                ? { ...n, children: replaceNode(n.children, id, replacement) }
                : n
        );

    // Drag-drop: promote target to container and insert source as child (with proportional rebalancing)
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setBlocks((prev) => {
            const sourceRes = findBlock(prev, active.id);
            const targetRes = findBlock(prev, over.id);
            if (!sourceRes.block || !targetRes.block) return prev;

            const source = sourceRes.block;
            const target = targetRes.block;
            const targetDef = DragRegistry[target.type];

            // Validate via registry
            const canNest =
                !!targetDef?.behaviors?.nestable &&
                !!targetDef?.validChildren?.includes(source.type);

            if (!canNest) return prev;

            // Build new children & sizes
            const existingChildren = target.children ?? [];
            const newChildren = [...existingChildren, source];

            const prevSizes =
                target.sizes ??
                (existingChildren.length
                    ? Array(existingChildren.length).fill(100 / existingChildren.length)
                    : []);

            const oldCount = prevSizes.length;
            const newCount = newChildren.length;

            let newSizes: number[];
            if (oldCount > 0) {
                // proportional scale: old sizes compressed to (oldCount/newCount)*100
                const scale = oldCount / newCount;
                const scaled = prevSizes.map((s) => s * scale);
                const used = scaled.reduce((a, b) => a + b, 0);
                newSizes = [...scaled, Math.max(0, 100 - used)];
            } else {
                newSizes = Array(newCount).fill(100 / newCount);
            }

            // Decide container type & direction from registry (default row)
            const direction = target.direction ?? targetDef?.direction ?? "row";
            const containerType =
                target.type === "containerBlock" || target.type === "verticalContainerBlock"
                    ? target.type
                    : direction === "column"
                    ? "verticalContainerBlock"
                    : "containerBlock";

            const promotedTarget: GridBlockProps = {
                ...target,
                type: containerType,
                direction,
                children: newChildren,
                sizes: newSizes,
            };

            // remove source from its old position, then replace target with promotedTarget
            const withoutSource = removeNode(prev, source.id);
            const updated = replaceNode(withoutSource, target.id, promotedTarget);
            return updated;
        });
    };

    // Simple toolbar to add a new leaf block to the root canvas
    const addBlock = () => {
        const id = Math.random().toString(36).slice(2, 8).toUpperCase();
        setBlocks((prev) => [...prev, { id, type: "displayBlock" }]);
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 space-y-4">
            <div className="flex items-center gap-2">
                <button onClick={addBlock} className="px-3 py-2 rounded bg-black text-white">
                    Add Block
                </button>
                <span className="text-sm text-gray-500">
                    Drag a block onto another to create a resizable container. Drag handles resize
                    panels.
                </span>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* Root-level sortable list */}
                <SortableList items={blocks}>
                    <div className="grid grid-cols-3 gap-4">
                        {blocks.map((block) => (
                            <SortableItem key={block.id} id={block.id} className="min-h-[120px]">
                                {/* If container, render resizable; else render leaf */}
                                {block.children?.length ? (
                                    <ResizableContainer
                                        block={block}
                                        onResize={(_, sizes) => {
                                            // persist sizes for this container
                                            setBlocks((prev) =>
                                                replaceNode(prev, block.id, { ...block, sizes })
                                            );
                                        }}
                                    />
                                ) : (
                                    <LeafBlock block={block} />
                                )}
                            </SortableItem>
                        ))}
                    </div>
                </SortableList>
            </DndContext>
        </div>
    );
};
