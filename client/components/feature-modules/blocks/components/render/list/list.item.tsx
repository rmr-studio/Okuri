/**
 * ContentBlockListItem - Individual sortable item within a ContentBlockList.
 *
 * Wraps a block node with drag-and-drop functionality using dnd-kit's useSortable hook.
 * Displays an optional drag handle and applies visual feedback during drag operations.
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode } from "react";
import { BlockListConfiguration } from "../../../interface/block.interface";

interface Props<T> {
    id: string;
    item: T;
    config: BlockListConfiguration;
    isDraggable: boolean;
    render: (item: T) => ReactNode;
}

/**
 * A single sortable item in a content block list.
 * Renders the block content with optional drag handle and drag feedback.
 */
export const ListItem = <T extends unknown>({
    id,
    item,
    config,
    isDraggable,
    render,
}: Props<T>) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: !isDraggable,
    });

    // Apply drag transform and transition
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const showDragHandle = isDraggable && config.display.showDragHandles;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative flex items-start gap-2 rounded-lg border border-border bg-background transition-shadow hover:shadow-md block-no-drag"
        >
            {/* Drag handle - only shown if draggable and configured */}
            {showDragHandle && (
                <div
                    {...attributes}
                    {...listeners}
                    className="flex cursor-grab items-center justify-center p-2 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    title="Drag to reorder"
                >
                    <GripVertical className="size-4" />
                </div>
            )}

            {/* Block content */}
            <div className="flex-1 overflow-hidden">{render(item)}</div>
        </div>
    );
};

// TODO Give each list item a dedicated editor panel
//  if (canMoveUp(parent, id)) {
//             quickActions.unshift({
//                 id: "move-up",
//                 label: "Move up",
//                 shortcut: "⌘↑",
//                 onSelect: () => moveBlockUp(id),
//             });
//         }
//         if (canMoveDown(parent, id)) {
//             quickActions.splice(1, 0, {
//                 id: "move-down",
//                 label: "Move down",
//                 shortcut: "⌘↓",
//                 onSelect: () => moveBlockDown(id),
//             });
//         }
