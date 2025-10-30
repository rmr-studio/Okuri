/**
 * Binding resolution utilities for BlockComponentNode bindings.
 *
 * Resolves bindings from BlockComponentNode to extract props from:
 * - Block payload data (DataPath bindings)
 * - Child blocks (RefSlot bindings)
 * - Component slots (Slot bindings)
 */

import { JSONPath } from "jsonpath-plus";
import {
    BlockBinding,
    BlockNode,
    Metadata,
    isContentNode,
} from "../../interface/block.interface";

/**
 * Resolves all bindings for a component to produce final props.
 *
 * @param bindings - Array of bindings from BlockComponentNode
 * @param payload - Block payload containing data
 * @param childBlocks - Map of slot name to child BlockNodes
 * @returns Object with resolved props ready for component
 */
export function resolveBindings(
    bindings: BlockBinding[],
    payload: Metadata,
    childBlocks: Record<string, BlockNode[]>
): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    bindings.forEach((binding) => {
        const value = resolveBinding(binding, payload, childBlocks);
        if (value !== undefined) {
            props[binding.prop] = value;
        }
    });

    return props;
}

/**
 * Resolves a single binding.
 */
function resolveBinding(
    binding: BlockBinding,
    payload: Metadata,
    childBlocks: Record<string, BlockNode[]>
): unknown {
    switch (binding.source.type) {
        case "DataPath":
            return resolveDataPath(binding.source.path, payload);

        case "RefSlot":
            return resolveRefSlot(binding.source, childBlocks);

        case "Slot":
            // Component slots - just return the slot name for now
            // The component itself will handle rendering child components
            return binding.source.slot;

        case "BlockTreeRef":
            // Block tree references - return child blocks
            return childBlocks[binding.source.slot] || [];

        case "ResolvedRefs":
            // Resolved entity references
            return resolveResolvedRefs(binding.source, payload, childBlocks);

        default:
            console.warn(`Unknown binding source type:`, binding.source);
            return undefined;
    }
}

/**
 * Resolves a DataPath binding using JSONPath.
 *
 * @param path - JSONPath string (e.g., "$.data/name")
 * @param payload - Block payload
 */
function resolveDataPath(path: string, payload: Metadata): unknown {
    try {
        // Convert "$.data/name" to "$.data.name" for JSONPath
        const normalizedPath = path.replace(/\//g, ".");

        const result = JSONPath({
            path: normalizedPath,
            json: payload,
            wrap: false,
        });

        return result;
    } catch (error) {
        console.warn(`Failed to resolve DataPath "${path}":`, error);
        return undefined;
    }
}

/**
 * Resolves a RefSlot binding to child blocks.
 *
 * @param source - RefSlot binding source
 * @param childBlocks - Map of slot name to child BlockNodes
 */
function resolveRefSlot(
    source: { slot: string; presentation?: string; expandDepth?: number },
    childBlocks: Record<string, BlockNode[]>
): unknown {
    const slotChildren = childBlocks[source.slot] || [];

    // Different presentations require different transformations
    switch (source.presentation) {
        case "SUMMARY":
            // Return summarized data from child blocks
            return slotChildren.map((child) => summarizeBlock(child));

        case "INLINE":
        case "ENTITY":
            // Return full child blocks for inline rendering
            return slotChildren;

        case "TABLE":
            // Return data suitable for table rendering
            return slotChildren.map((child) => extractBlockData(child));

        case "GRID":
            // Return data suitable for grid rendering
            return slotChildren.map((child) => extractBlockData(child));

        default:
            // Default to returning child blocks
            return slotChildren;
    }
}

/**
 * Resolves ResolvedRefs binding (for entity references).
 */
function resolveResolvedRefs(
    source: { path: string },
    payload: Metadata,
    childBlocks: Record<string, BlockNode[]>
): unknown {
    // Extract resolved references from payload
    return resolveDataPath(source.path, payload);
}

/**
 * Summarizes a block for SUMMARY presentation.
 */
function summarizeBlock(block: BlockNode): Record<string, unknown> {
    if (!isContentNode(block)) {
        return {
            id: block.block.id,
            type: "reference",
        };
    }

    return {
        id: block.block.id,
        name: block.block.name,
        type: block.block.type.key,
        data: block.block.payload.data || {},
    };
}

/**
 * Extracts data from a block for table/grid rendering.
 */
function extractBlockData(block: BlockNode): Record<string, unknown> {
    if (!isContentNode(block)) {
        return {
            id: block.block.id,
        };
    }

    return {
        id: block.block.id,
        name: block.block.name,
        ...((block.block.payload.data as Record<string, unknown>) || {}),
    };
}

/**
 * Checks if a component has wildcard slots ("*").
 */
export function hasWildcardSlots(component: {
    slots?: Record<string, string[]>;
}): boolean {
    if (!component.slots) return false;

    return Object.values(component.slots).some((slotIds) => slotIds.includes("*"));
}

/**
 * Finds the slot name that contains the wildcard marker.
 */
export function getWildcardSlotName(component: {
    slots?: Record<string, string[]>;
}): string | null {
    if (!component.slots) return null;

    const entry = Object.entries(component.slots).find(([_, ids]) => ids.includes("*"));
    return entry ? entry[0] : null;
}
