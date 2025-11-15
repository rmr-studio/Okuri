import { BlockNode } from "../../interface/block.interface";
import { CommandContext, LayoutCommand } from "../../interface/command.interface";
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
type CommandCreators =
    | CommandFactory["addBlock"]
    | CommandFactory["removeBlock"]
    | CommandFactory["moveBlock"]
    | CommandFactory["resizeBlock"]
    | CommandFactory["repositionBlock"]
    | CommandFactory["updateBlock"];

export class CommandFactory {
    constructor(private context: CommandContext) {}

    /**
     * Create a command to add a new block
     */
    addBlock(
        block: BlockNode,
        parentId: string | null = null,
        index: number | null = null
    ): AddBlockCommand {
        return new AddBlockCommand(this.context, block, parentId, index);
    }

    /**
     * Create a command to remove a block
     */
    removeBlock(blockId: string): RemoveBlockCommand {
        return new RemoveBlockCommand(this.context, blockId);
    }

    /**
     * Create a command to move a block to a different parent
     */
    moveBlock(blockId: string, newParentId: string | null): MoveBlockCommand {
        return new MoveBlockCommand(this.context, blockId, newParentId);
    }

    /**
     * Create a command to resize a block
     */
    resizeBlock(blockId: string, width: number, height: number): ResizeBlockCommand {
        return new ResizeBlockCommand(this.context, blockId, width, height);
    }

    /**
     * Create a command to reposition a block
     */
    repositionBlock(blockId: string, x: number, y: number): RepositionBlockCommand {
        return new RepositionBlockCommand(this.context, blockId, x, y);
    }

    /**
     * Create a command to update block content
     */

    updateBlock(blockId: string, updatedContent: BlockNode): UpdateBlockCommand {
        return new UpdateBlockCommand(this.context, blockId, updatedContent);
    }

    /**
     * Create a batch command from multiple commands
     */
    batch(commands: LayoutCommand[], description?: string) {
        return new BatchCommand(commands, description);
    }
}
