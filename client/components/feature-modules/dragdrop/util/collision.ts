"use client";

import { CollisionDetection, closestCenter, rectIntersection } from "@dnd-kit/core";

/**
 * Preconfigured collision strategies
 */
export const collisionStrategies: Record<string, CollisionDetection> = {
    closestCenter,
    rectIntersection,
};

// todo: Generate rule system for handling drag and drop with layout generation
const DRAGGABLE_PREFIXES = ["card", "file", "item"] as const;
type DraggableType = (typeof DRAGGABLE_PREFIXES)[number];

const DROPPABLE_PREFIXES = ["column", "folder", "container"] as const;
type DroppableType = (typeof DROPPABLE_PREFIXES)[number];

const RULES: Record<DraggableType, DroppableType[]> = {
    card: ["column"],
    file: ["folder"],
    item: ["container"],
};

/**
 * Validate if an item can be dropped on a target.
 *
 * Example rules:
 * - "card" → only in "column"
 * - "file" → only in "folder"
 */
export function isValidDropTarget(activeType: DraggableType, targetType: DroppableType): boolean {
    return RULES[activeType]?.includes(targetType) ?? false;
}
