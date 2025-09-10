"use client";

import {
    CollisionDetection,
    closestCenter,
    rectIntersection,
} from "@dnd-kit/core";
import { DragRegistry } from "./registry";

/**
 * Preconfigured collision strategies
 */
export const collisionStrategies: Record<string, CollisionDetection> = {
    closestCenter,
    rectIntersection,
};

/**
 * Enhanced collision detection that prioritizes valid drop targets
 */
export const containerCollisionDetection: CollisionDetection = (args) => {
    const intersections = rectIntersection(args);

    if (intersections.length === 0) return intersections;

    // Get the active item's type from the registry or data
    const activeId = args.active.id;
    const activeData = args.active.data?.current?.type;

    // Find the best drop target based on validation rules
    const validTargets = intersections.filter((collision) => {
        if (
            typeof collision.id !== "string" &&
            typeof collision.id !== "number"
        ) {
            return false;
        }

        // Get target type from collision data or infer from ID
        const targetType =
            collision.data?.type || inferTypeFromId(collision.id);

        if (!targetType || !activeData) return true; // Allow if we can't determine types

        // Check if this is a valid drop target
        const targetConfig = DragRegistry[targetType];
        if (!targetConfig?.behaviors?.nestable) return false;

        // Check if target accepts this source type
        if (
            targetConfig.validChildren &&
            !targetConfig.validChildren.includes(activeData)
        ) {
            return false;
        }

        return true;
    });

    // Return valid targets first, then all intersections
    return validTargets.length > 0 ? validTargets : intersections;
};

/**
 * Infer block type from ID (fallback method)
 */
function inferTypeFromId(id: string | number): string | null {
    const idStr = String(id);

    // Check for common patterns
    if (idStr.includes("container") || idStr.includes("Container")) {
        return "containerBlock";
    }
    if (idStr.includes("vertical") || idStr.includes("Vertical")) {
        return "verticalContainerBlock";
    }
    if (idStr.includes("widget") || idStr.includes("Widget")) {
        return "dashboardWidget";
    }
    if (idStr.includes("dashboard") || idStr.includes("Dashboard")) {
        return "dashboard";
    }
    if (idStr.includes("invoice") || idStr.includes("Invoice")) {
        return "invoicePage";
    }

    // Default to displayBlock for unknown types
    return "displayBlock";
}

/**
 * Smart collision detection that considers block hierarchy
 */
export const smartCollisionDetection: CollisionDetection = (args) => {
    const intersections = rectIntersection(args);

    if (intersections.length === 0) return intersections;

    // Prioritize containers over leaf blocks
    const containerTargets = intersections.filter((collision) => {
        const targetType =
            collision.data?.type || inferTypeFromId(collision.id);
        const config = DragRegistry[targetType];
        return config?.behaviors?.nestable;
    });

    // If we have container targets, prefer them
    if (containerTargets.length > 0) {
        return containerTargets;
    }

    // Otherwise return all intersections
    return intersections;
};

/**
 * Legacy validation function (kept for backward compatibility)
 */
export function isValidDropTarget(
    activeType: string,
    targetType: string
): boolean {
    const targetConfig = DragRegistry[targetType];
    if (!targetConfig?.behaviors?.nestable) return false;

    if (
        targetConfig.validChildren &&
        !targetConfig.validChildren.includes(activeType)
    ) {
        return false;
    }

    return true;
}
