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
import { ReactNode, useCallback, useRef } from "react";
import { useBlockEnvironment } from "../../../context/block-environment-provider";
import { BlockListConfiguration, BlockNode } from "../../../interface/block.interface";
import { ListPanel } from "./list.container";
import { ListItem } from "./list.item";
import { useBlockFocus } from "../../../context/block-focus-provider";

interface ContentBlockListProps {
    id: string;
    config: BlockListConfiguration;
    children: BlockNode[] | undefined;
    render: (node: BlockNode) => ReactNode;
}

/**
 * Main list component that handles drag-and-drop reordering for content block lists.
 */
export const ContentBlockList: React.FC<ContentBlockListProps> = ({
    id,
    config,
    children = [],
    render,
}) => {
    const { reorderBlock } = useBlockEnvironment();
    const {} = useBlockFocus();

    const dragLockRef = useRef<(() => void) | null>(null);

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

    // const handleDragStart = useCallback(() => {
    //     if (dragLockRef.current) return;
    //     dragLockRef.current = acquireLock({
    //         id: `list-drag-${id}`,
    //         reason: "List drag in progress",
    //         suppressHover: true,
    //         suppressSelection: true,
    //     });
    // }, [acquireLock, id]);

    // Handle drag end event to reorder blocks
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            // releaseDragLock();
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

    return (
        <ListPanel blockId={id}>
            {isEmpty && (
                <div className="p-4 text-sm text-muted-foreground">
                    No items yet. Add one to get started!
                </div>
            )}

            {isManualMode ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    // onDragStart={handleDragStart}
                    // onDragCancel={releaseDragLock}
                >
                    <SortableContext
                        items={children.map((child) => child.block.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-3">
                            {children.map((child) => (
                                <ListItem
                                    key={child.block.id}
                                    id={child.block.id}
                                    item={child}
                                    config={config}
                                    isDraggable={true}
                                    render={render}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="flex flex-col gap-3">
                    {children.map((child) => (
                        <ListItem
                            key={child.block.id}
                            id={child.block.id}
                            item={child}
                            config={config}
                            isDraggable={false}
                            render={render}
                        />
                    ))}
                </div>
            )}
        </ListPanel>
    );
};
