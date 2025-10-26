/**
 * BlockTreeAdapter
 *
 * Bridges between BlockTree (domain model) and GridStack (UI layer).
 * Handles conversion of BlockTree structures to GridStack widget configurations
 * and extraction of layout changes back into the BlockTree format.
 */

import type { GridStackOptions, GridStackWidget } from "gridstack";
import { BlockNode, BlockRenderStructure, BlockTree } from "../interface/block.interface";
import { EditorBlockInstance, EditorLayoutRect } from "../interface/editor.interface";

/**
 * Adapter for converting between BlockTree and GridStack representations
 */
export class BlockTreeAdapter {
    /**
     * Convert an EditorBlockInstance to GridStack options for rendering
     */
    static toGridStackWidget(
        instance: EditorBlockInstance,
        renderMode?: "panel" | "block"
    ): GridStackWidget {
        const { tree, layout } = instance;
        const blockId = tree.root.block.id;

        // Auto-determine render mode if not specified
        const mode = renderMode ?? this.determineRenderMode(tree);

        return {
            id: blockId,
            x: layout.x,
            y: layout.y,
            w: layout.w,
            h: layout.h,
            locked: instance.uiMetadata?.locked ?? false,
            noMove: instance.uiMetadata?.locked ?? false,
            noResize: instance.uiMetadata?.locked ?? false,
            content: JSON.stringify({
                type: mode === "panel" ? "EDITOR_PANEL" : "EDITOR_BLOCK",
                props: {
                    blockId: blockId,
                },
            }),
        };
    }

    /**
     * Determine if a block should render as a panel (supports nesting) or simple block
     */
    static determineRenderMode(tree: BlockTree): "panel" | "block" {
        const nesting = tree.root.block.type.nesting;
        return nesting ? "panel" : "block";
    }

    /**
     * Build GridStack options from a collection of block instances
     */
    static toGridStackOptions(
        instances: EditorBlockInstance[],
        gridConfig?: {
            cols?: number;
            rowHeight?: number;
            margin?: number;
        }
    ): GridStackOptions {
        return {
            column: gridConfig?.cols ?? 12,
            cellHeight: gridConfig?.rowHeight ?? 60,
            margin: gridConfig?.margin ?? 12,
            animate: true,
            acceptWidgets: true,
            children: instances.map((instance) => this.toGridStackWidget(instance)),
        };
    }

    /**
     * Check if a BlockTree can nest other blocks
     */
    static canNest(tree: BlockTree): boolean {
        return Boolean(tree.root.block.type.nesting);
    }

    /**
     * Extract all block IDs from a BlockTree (including nested blocks)
     */
    static getAllBlockIds(tree: BlockTree): string[] {
        const ids: string[] = [];
        this.collectBlockIds(tree.root, ids);
        return ids;
    }

    /**
     * Recursively collect block IDs from a BlockNode
     */
    private static collectBlockIds(node: BlockNode, accumulator: string[]): void {
        accumulator.push(node.block.id);

        // Traverse all slots
        if (node.children) {
            Object.values(node.children).forEach((childrenInSlot) => {
                childrenInSlot.forEach((child) => {
                    this.collectBlockIds(child, accumulator);
                });
            });
        }
    }

    /**
     * Get the BlockRenderStructure from a BlockTree
     */
    static getRenderStructure(tree: BlockTree): BlockRenderStructure {
        return tree.root.block.type.display.render;
    }

    /**
     * Extract layout information from GridStack widget state
     */
    static extractLayout(widget: GridStackWidget): EditorLayoutRect {
        return {
            x: widget.x ?? 0,
            y: widget.y ?? 0,
            w: widget.w ?? 12,
            h: widget.h ?? 4,
        };
    }

    /**
     * Get a child BlockNode by ID from within a parent BlockNode
     */
    static findChildById(node: BlockNode, targetId: string): BlockNode | undefined {
        if (node.block.id === targetId) {
            return node;
        }

        if (!node.children) return undefined;

        for (const childrenInSlot of Object.values(node.children)) {
            for (const child of childrenInSlot) {
                const found = this.findChildById(child, targetId);
                if (found) return found;
            }
        }

        return undefined;
    }

    /**
     * Get all children in a specific slot
     */
    static getChildrenInSlot(node: BlockNode, slotName: string): BlockNode[] {
        if (!node.children || !node.children[slotName]) {
            return [];
        }
        return node.children[slotName];
    }

    /**
     * Count total number of blocks in a tree
     */
    static countBlocks(tree: BlockTree): number {
        return this.getAllBlockIds(tree).length;
    }

    /**
     * Get the maximum depth of a block tree
     */
    static getDepth(node: BlockNode, currentDepth: number = 0): number {
        if (!node.children || Object.keys(node.children).length === 0) {
            return currentDepth;
        }

        let maxDepth = currentDepth;
        Object.values(node.children).forEach((childrenInSlot) => {
            childrenInSlot.forEach((child) => {
                const depth = this.getDepth(child, currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            });
        });

        return maxDepth;
    }

    /**
     * Get metadata from a BlockTree for display purposes
     */
    static getDisplayMetadata(tree: BlockTree): {
        name: string;
        description?: string;
        typeKey: string;
        canNest: boolean;
    } {
        const block = tree.root.block;
        return {
            name: block.name ?? block.type.name,
            description: block.type.description,
            typeKey: block.type.key,
            canNest: this.canNest(tree),
        };
    }

    /**
     * Validate that a block tree is well-formed
     */
    static validate(tree: BlockTree): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!tree.root) {
            errors.push("BlockTree must have a root node");
            return { valid: false, errors };
        }

        if (!tree.root.block) {
            errors.push("Root node must have a block");
            return { valid: false, errors };
        }

        if (!tree.root.block.id) {
            errors.push("Block must have an ID");
        }

        if (!tree.root.block.type) {
            errors.push("Block must have a type");
        }

        if (!tree.root.block.payload) {
            errors.push("Block must have a payload");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
