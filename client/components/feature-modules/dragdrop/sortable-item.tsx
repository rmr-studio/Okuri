"use client";

import { ClassNameProps, FCWC } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableItemProps } from "./sortable-wrapper";

/**
 * SortableItem
 *
 * Wraps dnd-kit’s `useSortable` hook into a reusable component.
 * Handles transform/transition styling automatically,
 * and exposes drag attributes + listeners for accessibility and interactivity.
 *
 * Usage:
 * ```tsx
 * <SortableItem id="1">
 *   <div className="p-2 bg-white rounded shadow">Item 1</div>
 * </SortableItem>
 * ```
 */

interface Props extends SortableItemProps, ClassNameProps {}

export const SortableItem: FCWC<Props> = ({ id, children, className }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    // Convert transform object into a CSS string
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Recommended UX patterns
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn("transition-opacity", className)}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    );
};
