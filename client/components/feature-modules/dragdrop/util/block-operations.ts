// dragdrop/block-operations.ts
import { nanoid } from "nanoid";
import { DragRegistry, getDefaultBlockData, validateDrop } from "./registry";
import { BlockTreeOperations, GridBlockProps } from "./types";

/**
 * Block tree operations utility
 * Provides all the operations needed to manipulate the block tree
 */
export class BlockTreeManager {
    private blocks: GridBlockProps[];

    constructor(blocks: GridBlockProps[] = []) {
        this.blocks = blocks;
    }

    /**
     * Get current blocks
     */
    getBlocks(): GridBlockProps[] {
        return this.blocks;
    }

    /**
     * Set blocks
     */
    setBlocks(blocks: GridBlockProps[]): void {
        this.blocks = blocks;
    }

    /**
     * Find a block by ID in the tree
     */
    findBlock(id: string | number): {
        block?: GridBlockProps;
        parent?: GridBlockProps;
        index?: number;
    } {
        const findInArray = (
            nodes: GridBlockProps[]
        ): {
            block?: GridBlockProps;
            parent?: GridBlockProps;
            index?: number;
        } => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    return { block: nodes[i], index: i };
                }
                if (nodes[i].children) {
                    const result = findInArray(nodes[i].children!);
                    if (result.block) {
                        return { ...result, parent: nodes[i] };
                    }
                }
            }
            return {};
        };

        return findInArray(this.blocks);
    }

    /**
     * Add a new block to a parent
     */
    addBlock(
        parentId: string | number,
        blockType: string,
        data?: any
    ): GridBlockProps[] {
        const newBlock: GridBlockProps = {
            id: nanoid(8),
            type: blockType,
            data: data || getDefaultBlockData(blockType),
            children: [],
        };

        const addToParent = (nodes: GridBlockProps[]): GridBlockProps[] => {
            return nodes.map((node) => {
                if (node.id === parentId) {
                    const updatedChildren = [
                        ...(node.children || []),
                        newBlock,
                    ];
                    const newSizes = this.calculateSizes(
                        updatedChildren,
                        node.sizes
                    );
                    return {
                        ...node,
                        children: updatedChildren,
                        sizes: newSizes,
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: addToParent(node.children),
                    };
                }
                return node;
            });
        };

        this.blocks = addToParent(this.blocks);
        return this.blocks;
    }

    /**
     * Remove a block from the tree
     */
    removeBlock(blockId: string | number): GridBlockProps[] {
        const removeFromArray = (nodes: GridBlockProps[]): GridBlockProps[] => {
            return nodes
                .filter((node) => node.id !== blockId)
                .map((node) => ({
                    ...node,
                    children: node.children
                        ? removeFromArray(node.children)
                        : [],
                }));
        };

        this.blocks = removeFromArray(this.blocks);
        return this.blocks;
    }

    /**
     * Move a block to a new parent
     */
    moveBlock(
        blockId: string | number,
        newParentId: string | number,
        index?: number
    ): GridBlockProps[] {
        const source = this.findBlock(blockId);
        if (!source.block) return this.blocks;

        // Remove from current location
        let updatedBlocks = this.removeBlock(blockId);

        // Add to new location
        const addToNewParent = (nodes: GridBlockProps[]): GridBlockProps[] => {
            return nodes.map((node) => {
                if (node.id === newParentId) {
                    const updatedChildren = [...(node.children || [])];
                    const insertIndex =
                        index !== undefined ? index : updatedChildren.length;
                    updatedChildren.splice(insertIndex, 0, source.block!);

                    const newSizes = this.calculateSizes(
                        updatedChildren,
                        node.sizes
                    );
                    return {
                        ...node,
                        children: updatedChildren,
                        sizes: newSizes,
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: addToNewParent(node.children),
                    };
                }
                return node;
            });
        };

        this.blocks = addToNewParent(updatedBlocks);
        return this.blocks;
    }

    /**
     * Update a block's properties
     */
    updateBlock(
        blockId: string | number,
        updates: Partial<GridBlockProps>
    ): GridBlockProps[] {
        const updateInArray = (nodes: GridBlockProps[]): GridBlockProps[] => {
            return nodes.map((node) => {
                if (node.id === blockId) {
                    return { ...node, ...updates };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: updateInArray(node.children),
                    };
                }
                return node;
            });
        };

        this.blocks = updateInArray(this.blocks);
        return this.blocks;
    }

    /**
     * Resize a block's panels
     */
    resizeBlock(blockId: string | number, sizes: number[]): GridBlockProps[] {
        return this.updateBlock(blockId, { sizes });
    }

    /**
     * Handle drag and drop operation
     */
    handleDragDrop(
        activeId: string | number,
        overId: string | number
    ): { success: boolean; blocks: GridBlockProps[]; error?: string } {
        const source = this.findBlock(activeId);
        const target = this.findBlock(overId);

        if (!source.block || !target.block) {
            return {
                success: false,
                blocks: this.blocks,
                error: "Source or target block not found",
            };
        }

        // Validate the drop
        const validation = validateDrop(
            source.block.type,
            target.block.type,
            activeId,
            overId
        );
        if (!validation.isValid) {
            return {
                success: false,
                blocks: this.blocks,
                error: validation.reason,
            };
        }

        // Check if target needs to be converted to a container
        const targetConfig = DragRegistry[target.block.type];
        let finalTarget = target.block;

        if (!targetConfig.behaviors?.nestable) {
            // Convert target to a container if it's not already one
            const containerType =
                targetConfig.direction === "column"
                    ? "verticalContainerBlock"
                    : "containerBlock";
            finalTarget = {
                ...target.block,
                type: containerType,
                children: [],
                sizes: [],
            };
        }

        // Move the block
        this.blocks = this.moveBlock(activeId, overId);

        // Update target to be a container if needed
        if (finalTarget !== target.block) {
            this.blocks = this.updateBlock(overId, finalTarget);
        }

        return { success: true, blocks: this.blocks };
    }

    /**
     * Calculate panel sizes for a container
     */
    private calculateSizes(
        children: GridBlockProps[],
        existingSizes?: number[]
    ): number[] {
        const childCount = children.length;
        if (childCount === 0) return [];

        // If we have existing sizes and the count matches, keep them
        if (existingSizes && existingSizes.length === childCount) {
            return existingSizes;
        }

        // If we're adding a new child, scale existing sizes
        if (existingSizes && existingSizes.length > 0) {
            const scale = existingSizes.length / childCount;
            const scaledSizes = existingSizes.map((size) => size * scale);
            const remainder =
                100 - scaledSizes.reduce((sum, size) => sum + size, 0);

            // Add the remainder to the last child
            if (scaledSizes.length > 0) {
                scaledSizes[scaledSizes.length - 1] += remainder;
            }

            return scaledSizes;
        }

        // Default: equal distribution
        return children.map(() => 100 / childCount);
    }

    /**
     * Get operations interface
     */
    getOperations(): BlockTreeOperations {
        return {
            addBlock: (parentId, block) => {
                this.blocks = this.addBlock(parentId, block.type, block.data);
                return this.blocks;
            },
            removeBlock: (blockId) => {
                this.blocks = this.removeBlock(blockId);
                return this.blocks;
            },
            moveBlock: (blockId, newParentId, index) => {
                this.blocks = this.moveBlock(blockId, newParentId, index);
                return this.blocks;
            },
            updateBlock: (blockId, updates) => {
                this.blocks = this.updateBlock(blockId, updates);
                return this.blocks;
            },
            resizeBlock: (blockId, sizes) => {
                this.blocks = this.resizeBlock(blockId, sizes);
                return this.blocks;
            },
        };
    }
}

/**
 * Create a new block tree manager
 */
export function createBlockTreeManager(
    blocks: GridBlockProps[] = []
): BlockTreeManager {
    return new BlockTreeManager(blocks);
}
