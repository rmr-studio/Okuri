/**
 * ContentBlockList - Renders a list of content blocks with drag-and-drop reordering.
 *
 * Uses dnd-kit for list item reordering (MANUAL mode) or displays items in sorted order (SORTED mode).
 * This component handles the internal list logic, while the list block itself remains a GridStack panel.
 */

"use client";

import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ReactNode, useCallback } from "react";
import { useBlockEnvironment } from "../../../context/block-environment-provider";
import { BlockListConfiguration, BlockNode } from "../../../interface/block.interface";
import { ContentBlockListItem } from "./list.item";

interface ContentBlockListProps {
    id: string;
    config: BlockListConfiguration;
    children: BlockNode[] | undefined;
    renderChildBlock?: (node: BlockNode) => ReactNode;
}

/**
 * Main list component that handles drag-and-drop reordering for content block lists.
 */
export const ContentBlockList: React.FC<ContentBlockListProps> = ({
    id,
    config,
    children = [],
    renderChildBlock,
}) => {
    const { reorderBlock } = useBlockEnvironment();

    // Configure dnd-kit sensors for pointer and keyboard interaction
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end event to reorder blocks
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (over && active.id !== over.id) {
                const oldIndex = children.findIndex((child) => child.block.id === active.id);
                const newIndex = children.findIndex((child) => child.block.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    // Calculate the new array to determine target index
                    const newOrder = arrayMove(children, oldIndex, newIndex);
                    const targetIndex = newOrder.findIndex((child) => child.block.id === active.id);

                    // Call reorderBlock to update the environment
                    reorderBlock(active.id as string, id, targetIndex);
                }
            }
        },
        [children, id, reorderBlock]
    );

    const isManualMode = config.order.mode === "MANUAL";
    const isEmpty = children.length === 0;

    // Empty state
    if (isEmpty) {
        return (
            <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
                <p className="text-sm text-muted-foreground">
                    {config.display.emptyMessage || "No items yet. Add one to get started!"}
                </p>
            </div>
        );
    }

    // Sorted mode - no drag and drop
    if (!isManualMode) {
        return (
            <div className="flex flex-col gap-3">
                {children.map((child) => (
                    <ContentBlockListItem
                        key={child.block.id}
                        node={child}
                        listConfig={config}
                        isDraggable={false}
                        renderChildBlock={renderChildBlock}
                    />
                ))}
            </div>
        );
    }

    // Manual mode - with drag and drop
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={children.map((child) => child.block.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-3">
                    {children.map((child) => (
                        <ContentBlockListItem
                            key={child.block.id}
                            node={child}
                            listConfig={config}
                            isDraggable={true}
                            renderChildBlock={renderChildBlock}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};
