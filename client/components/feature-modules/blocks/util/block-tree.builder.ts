/**
 * BlockTreeBuilder
 *
 * Helper utilities for creating and modifying BlockTree structures.
 * Provides a fluent API for building blocks programmatically.
 */

import {
    Block,
    BlockNode,
    BlockTree,
    BlockType,
} from "../interface/block.interface";

/**
 * Utility class for building and manipulating BlockTree structures
 */
export class BlockTreeBuilder {
    /**
     * Create a new BlockTree from a BlockType definition
     */
    static fromBlockType(
        blockType: BlockType,
        organisationId: string,
        initialData?: Record<string, unknown>
    ): BlockTree {
        const blockId = this.generateId("block");

        const block: Block = {
            id: blockId,
            name: undefined,
            organisationId,
            type: blockType,
            payload: {
                data: initialData ?? {},
                refs: [],
                meta: { validationErrors: [] },
            },
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const root: BlockNode = {
            block,
            children: {},
            references: {},
            warnings: [],
        };

        return {
            maxDepth: 0,
            expandRefs: false,
            root,
        };
    }

    /**
     * Create a minimal BlockTree with just essential data (for testing/mocking)
     */
    static createMinimal(
        typeKey: string,
        organisationId: string = "org-test",
        data: Record<string, unknown> = {}
    ): BlockTree {
        const blockId = this.generateId("block");

        // Create a minimal BlockType
        const blockType: BlockType = {
            id: this.generateId("type"),
            key: typeKey,
            version: 1,
            name: typeKey,
            archived: false,
            strictness: "SOFT",
            system: false,
            schema: {
                name: "root",
                type: "OBJECT",
                required: false,
                properties: {},
            },
            display: {
                form: { fields: {} },
                render: {
                    version: 1,
                    layoutGrid: {
                        cols: 12,
                        rowHeight: 40,
                        margin: 8,
                        items: [],
                    },
                    components: {},
                },
            },
        };

        const block: Block = {
            id: blockId,
            organisationId,
            type: blockType,
            payload: {
                data,
                refs: [],
                meta: { validationErrors: [] },
            },
            archived: false,
        };

        return {
            maxDepth: 0,
            expandRefs: false,
            root: {
                block,
                children: {},
                references: {},
                warnings: [],
            },
        };
    }

    /**
     * Add a child block to a parent's slot
     */
    static addChildToSlot(
        parentTree: BlockTree,
        slotName: string,
        childTree: BlockTree,
        position?: number
    ): BlockTree {
        // Deep clone to avoid mutations
        const cloned = this.cloneTree(parentTree);

        // Ensure the slot exists
        if (!cloned.root.children[slotName]) {
            cloned.root.children[slotName] = [];
        }

        const slot = cloned.root.children[slotName];

        // Insert at position or append
        if (position !== undefined && position >= 0 && position <= slot.length) {
            slot.splice(position, 0, childTree.root);
        } else {
            slot.push(childTree.root);
        }

        // Update maxDepth if needed
        cloned.maxDepth = Math.max(cloned.maxDepth, 1);

        return cloned;
    }

    /**
     * Remove a child from a parent's slot
     */
    static removeChildFromSlot(
        parentTree: BlockTree,
        slotName: string,
        childId: string
    ): BlockTree {
        const cloned = this.cloneTree(parentTree);

        if (!cloned.root.children[slotName]) {
            return cloned;
        }

        cloned.root.children[slotName] = cloned.root.children[slotName].filter(
            (child) => child.block.id !== childId
        );

        return cloned;
    }

    /**
     * Update the payload data of a block
     */
    static updatePayload(
        tree: BlockTree,
        updates: Partial<Record<string, unknown>>
    ): BlockTree {
        const cloned = this.cloneTree(tree);
        cloned.root.block.payload.data = {
            ...cloned.root.block.payload.data,
            ...updates,
        };
        cloned.root.block.updatedAt = new Date().toISOString();
        return cloned;
    }

    /**
     * Update block metadata (name, archived status, etc.)
     */
    static updateMetadata(
        tree: BlockTree,
        updates: {
            name?: string;
            archived?: boolean;
        }
    ): BlockTree {
        const cloned = this.cloneTree(tree);

        if (updates.name !== undefined) {
            cloned.root.block.name = updates.name;
        }

        if (updates.archived !== undefined) {
            cloned.root.block.archived = updates.archived;
        }

        cloned.root.block.updatedAt = new Date().toISOString();

        return cloned;
    }

    /**
     * Find a nested block node by ID within a tree
     */
    static findNodeById(tree: BlockTree, targetId: string): BlockNode | undefined {
        return this.findNodeByIdRecursive(tree.root, targetId);
    }

    private static findNodeByIdRecursive(
        node: BlockNode,
        targetId: string
    ): BlockNode | undefined {
        if (node.block.id === targetId) {
            return node;
        }

        if (!node.children) return undefined;

        for (const childrenInSlot of Object.values(node.children)) {
            for (const child of childrenInSlot) {
                const found = this.findNodeByIdRecursive(child, targetId);
                if (found) return found;
            }
        }

        return undefined;
    }

    /**
     * Clone a BlockTree (deep copy)
     */
    static cloneTree(tree: BlockTree): BlockTree {
        return JSON.parse(JSON.stringify(tree));
    }

    /**
     * Clone a BlockNode (deep copy)
     */
    static cloneNode(node: BlockNode): BlockNode {
        return JSON.parse(JSON.stringify(node));
    }

    /**
     * Generate a unique ID (UUID-like for client-side generation)
     */
    static generateId(prefix: string = "block"): string {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for environments without crypto.randomUUID
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    /**
     * Merge two BlockTrees (useful for updates from server)
     */
    static merge(target: BlockTree, source: Partial<BlockTree>): BlockTree {
        return {
            ...target,
            ...source,
            root: source.root ? { ...target.root, ...source.root } : target.root,
        };
    }

    /**
     * Get all slot names defined in a BlockType
     */
    static getSlotNames(tree: BlockTree): string[] {
        const renderStructure = tree.root.block.type.display.render;
        const slotNames = new Set<string>();

        // Scan components for slots
        Object.values(renderStructure.components).forEach((component) => {
            if (component.slots) {
                Object.keys(component.slots).forEach((slotName) => {
                    slotNames.add(slotName);
                });
            }
        });

        return Array.from(slotNames);
    }

    /**
     * Check if a block has any children
     */
    static hasChildren(tree: BlockTree): boolean {
        if (!tree.root.children) return false;
        return Object.values(tree.root.children).some((slot) => slot.length > 0);
    }

    /**
     * Get total count of children across all slots
     */
    static getChildCount(tree: BlockTree): number {
        if (!tree.root.children) return 0;
        return Object.values(tree.root.children).reduce(
            (total, slot) => total + slot.length,
            0
        );
    }

    /**
     * Validate that a child can be added to a parent based on nesting rules
     */
    static canAddChild(
        parentTree: BlockTree,
        childTree: BlockTree
    ): { allowed: boolean; reason?: string } {
        const nesting = parentTree.root.block.type.nesting;

        if (!nesting) {
            return { allowed: false, reason: "Parent block does not support nesting" };
        }

        // Check if child type is allowed
        const childType = childTree.root.block.type.key;
        // Note: nesting.allowedTypes contains component types, not block types
        // This validation might need adjustment based on your schema

        // Check max children limit
        if (nesting.max !== undefined) {
            const currentCount = this.getChildCount(parentTree);
            if (currentCount >= nesting.max) {
                return {
                    allowed: false,
                    reason: `Maximum children limit reached (${nesting.max})`,
                };
            }
        }

        return { allowed: true };
    }
}
