import { BlockNode } from "../../interface/block.interface";
import { CommandContext } from "../../interface/command.interface";
import {
    AddBlockCommand,
    BatchCommand,
    MoveBlockCommand,
    RemoveBlockCommand,
    RepositionBlockCommand,
    ResizeBlockCommand,
    UpdateBlockCommand,
} from "./commands";

/**
 * Factory for creating command instances
 * Provides a clean API for command creation throughout the application
 */
export class CommandFactory {
    constructor(private context: CommandContext) {}

    /**
     * Create a command to add a new block
     */
    addBlock(block: BlockNode, parentId: string | null = null, index: number | null = null) {
        return new AddBlockCommand(this.context, block, parentId, index);
    }

    /**
     * Create a command to remove a block
     */
    removeBlock(blockId: string) {
        return new RemoveBlockCommand(this.context, blockId);
    }

    /**
     * Create a command to move a block to a different parent
     */
    moveBlock(blockId: string, newParentId: string | null) {
        return new MoveBlockCommand(this.context, blockId, newParentId);
    }

    /**
     * Create a command to resize a block
     */
    resizeBlock(blockId: string, width: number, height: number) {
        return new ResizeBlockCommand(this.context, blockId, width, height);
    }

    /**
     * Create a command to reposition a block
     */
    repositionBlock(blockId: string, x: number, y: number) {
        return new RepositionBlockCommand(this.context, blockId, x, y);
    }

    /**
     * Create a command to update block content
     */
    updateBlock(blockId: string, updatedContent: BlockNode) {
        return new UpdateBlockCommand(this.context, blockId, updatedContent);
    }

    /**
     * Create a batch command from multiple commands
     */
    batch(commands: ReturnType<CommandFactory[keyof CommandFactory]>[], description?: string) {
        return new BatchCommand(commands, description);
    }
}
