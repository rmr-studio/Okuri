/**
 * Recursive widget tree builder for GridStack.
 *
 * Maintains a strict 1:1 mapping between block nodes and GridStack widgets.
 * Each widget ID corresponds to exactly one block ID, ensuring hierarchy
 * integrity during drag operations.
 */

import type { GridStackOptions, GridStackWidget } from "gridstack";
import { BlockNode, isContentNode } from "../../interface/block.interface";
import { getCurrentDimensions } from "../block/block.util";
import { hasWildcardSlots } from "./binding.resolver";

/**
 * Recursively builds a GridStack widget tree from a block node.
 *
 * For each block node:
 * - Creates exactly ONE widget with ID = block.id
 * - Registers widget in the provided widgetMap
 * - If node has children, creates subgrid with child widgets
 *
 * @param node - The block node to convert to a widget
 * @param widgetMap - Map to register all widgets (mutated by this function)
 * @returns The GridStack widget configuration for this node
 */
export function treeInit(
    node: BlockNode,
    widgetMap: Map<string, GridStackWidget>
): GridStackWidget {
    const blockId = node.block.id;
    const layout = node.block.layout ?? getCurrentDimensions(node);
    const renderStructure = node.block.type.display.render;

    // ONE widget for this ONE block node (even if it has multiple components)
    const widget: GridStackWidget = {
        id: blockId, // Critical: widget ID = block ID for 1:1 mapping
        x: layout.x,
        y: layout.y,
        w: layout.width,
        h: layout.height,
        content: JSON.stringify({
            blockId: blockId,
            blockTypeKey: node.block.type.key,
            renderStructure: renderStructure, // Full component definition
            // Don't include payload - will be fetched from BlockEnvironment
        }),
    };

    // Register this widget in the map immediately
    widgetMap.set(blockId, widget);

    // Check if ANY component in this block has wildcard slots
    const hasWildcards = Object.values(renderStructure.components || {}).some((component) =>
        hasWildcardSlots(component)
    );

    // Only create subgrids for blocks with wildcard slots (dynamic containers)
    if (hasWildcards && isContentNode(node)) {
        const subgridOpt: Partial<GridStackOptions> = {
            column: 12,
            cellHeight: 40,
            margin: 8,
            acceptWidgets: true,
            animate: true,
            class: "grid-stack-subgrid",
        };

        if (!node.children) {
            widget.subGridOpts = subgridOpt;
            widgetMap.set(blockId, widget); // Update map with subgrid info
            return widget;
        }

        // Process each slot's children
        const children: GridStackWidget[] = Object.entries(node.children).flatMap(
            ([slotName, slotChildren]) => {
                return slotChildren.map((child) => {
                    // Recursively build child widget
                    return treeInit(child, widgetMap);

                    // Note: child is already added to widgetMap inside buildWidgetTree
                });
            }
        );

        widget.subGridOpts = {
            ...subgridOpt,
            children: children,
        };

        widgetMap.set(blockId, widget); // Update map with subgrid info
    }

    return widget;
}

/**
 * Builds the complete GridStack configuration from an array of block trees.
 *
 * @param trees - Array of block trees to convert
 * @returns Object containing GridStack options and complete widget map
 */
export function environmentInit(trees: { root: BlockNode }[]): {
    options: GridStackOptions;
    widgetMap: Map<string, GridStackWidget>;
} {
    const widgetMap = new Map<string, GridStackWidget>();

    const rootWidgets = trees.map((tree) => {
        return treeInit(tree.root, widgetMap);
    });

    return {
        options: {
            margin: 12,
            animate: true,
            acceptWidgets: true,
            children: rootWidgets,
        },
        widgetMap, // Contains ALL widgets (roots + all descendants)
    };
}
