/**
 * ContentBlockListItem - Individual sortable item within a ContentBlockList.
 *
 * Wraps a block node with drag-and-drop functionality using dnd-kit's useSortable hook.
 * Displays an optional drag handle and applies visual feedback during drag operations.
 */

"use client";

import { ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode, useCallback, useMemo } from "react";
import { useTrackedEnvironment } from "../../../context/tracked-environment-provider";
import { BlockListConfiguration } from "../../../interface/block.interface";
import { PanelWrapper } from "../../panel/panel-wrapper";

interface Props<T> extends ClassNameProps {
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
    className,
    isDraggable,
    render,
}: Props<T>) => {
    const { removeTrackedBlock } = useTrackedEnvironment();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: !isDraggable,
    });

    const handleDelete = useCallback(() => removeTrackedBlock(id), [removeTrackedBlock, id]);

    const quickActions = useMemo(
        () => [
            {
                id: "delete",
                label: "Delete block",
                shortcut: "⌘⌫",
                onSelect: handleDelete,
            },
        ],
        [handleDelete]
    );

    // Apply drag transform and transition
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const showDragHandle = isDraggable && config.display.showDragHandles;

    return (
        <div ref={setNodeRef} style={style} className={cn("relative block-no-drag", className)}>
            <PanelWrapper
                className="w-full relative flex-row items-center gap-2 "
                id={id}
                quickActions={quickActions}
                allowInsert={false}
                onDelete={handleDelete}
            >
                {/* Sorted mode indicator */}
                {!isDraggable && (
                    <div className="px-2 py-0.5 text-xs text-muted-foreground bg-muted/50 rounded border border-muted-foreground/20 whitespace-nowrap">
                        Sorted
                    </div>
                )}

                {/* Block content */}
                <div className="flex-1 overflow-hidden" {...attributes} {...listeners}>
                    {render(item)}
                </div>
            </PanelWrapper>
        </div>
    );
};
