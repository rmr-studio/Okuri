"use client";

import { DragOverlay } from "@dnd-kit/core";
import { FC, JSX } from "react";

export interface Props {
    /** The currently active draggable item id */
    id: string | number | null;
    /** Registry mapping types to render functions */
    renderOverlay: (id: string | number) => JSX.Element;
}

/**
 * DragOverlayRenderer
 *
 * Provides a centralized way to render the drag “ghost”.
 * Consumers pass in a registry of renderers keyed by type.
 *
 * Example:
 * ```tsx
 * <DragOverlayRenderer
 *   id={id}
 *   renderOverlay={(id) => {
 *     return <Component id={id} />;
 *   }}
 * />
 * ```
 */
export const DragOverlayRenderer: FC<Props> = ({ id, renderOverlay }) => {
    if (!id) return null;
    return <DragOverlay>{renderOverlay(id)}</DragOverlay>;
};

// todo: Create default overlay renderer that clones the original element for each type of draggable item