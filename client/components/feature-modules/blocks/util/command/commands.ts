import { GridStackWidget } from "gridstack";
import { v4 as uuidv4 } from "uuid";
import { BlockNode } from "../../interface/block.interface";
import { CommandContext, LayoutCommand, LayoutCommandType } from "../../interface/command.interface";

/**
 * Base command class with common functionality
 */
abstract class BaseCommand implements LayoutCommand {
    public readonly id: string;
    public readonly timestamp: number;
    public metadata?: Record<string, unknown>;

    constructor(
        public readonly type: LayoutCommandType,
        public readonly description: string,
        metadata?: Record<string, unknown>
    ) {
        this.id = uuidv4();
        this.timestamp = Date.now();
        this.metadata = metadata;
    }

    abstract execute(): void;
    abstract undo(): void;

    canExecute?(): boolean {
        return true;
    }

    canUndo?(): boolean {
        return true;
    }
}

/**
 * Command: Add a new block to the environment
 */
export class AddBlockCommand extends BaseCommand {
    private addedBlockId?: string;

    constructor(
        private context: CommandContext,
        private block: BlockNode,
        private parentId: string | null = null,
        private index: number | null = null
    ) {
        super(
            LayoutCommandType.ADD_BLOCK,
            `Add block "${block.block.type.name}"${parentId ? ` to ${parentId}` : ""}`,
            { blockId: block.block.id, parentId }
        );
    }

    execute(): void {
        // Add block to environment
        this.addedBlockId = this.context.blockEnvironment.addBlock(
            this.block,
            this.parentId,
            this.index
        );

        console.log(`✅ [CMD] Added block ${this.addedBlockId}`);
    }

    undo(): void {
        if (!this.addedBlockId) {
            console.warn("Cannot undo AddBlockCommand: no block ID recorded");
            return;
        }

        // Remove the block that was added
        this.context.blockEnvironment.removeBlock(this.addedBlockId);

        console.log(`⏪ [CMD] Removed block ${this.addedBlockId}`);
    }
}

/**
 * Command: Remove a block from the environment
 */
export class RemoveBlockCommand extends BaseCommand {
    private removedBlock?: BlockNode;
    private originalParentId?: string | null;
    private originalIndex?: number;

    constructor(
        private context: CommandContext,
        private blockId: string
    ) {
        super(LayoutCommandType.REMOVE_BLOCK, `Remove block ${blockId}`, { blockId });
    }

    execute(): void {
        // Store block data for undo
        this.removedBlock = this.context.blockEnvironment.getBlock(this.blockId);
        this.originalParentId = this.context.blockEnvironment.getParentId(this.blockId);

        if (!this.removedBlock) {
            console.warn(`Cannot remove block ${this.blockId}: not found`);
            return;
        }

        // TODO: Store original index within parent's children array
        // This would require adding a getBlockIndex() method to BlockEnvironment

        // Remove the block
        this.context.blockEnvironment.removeBlock(this.blockId);

        console.log(`✅ [CMD] Removed block ${this.blockId}`);
    }

    undo(): void {
        if (!this.removedBlock) {
            console.warn("Cannot undo RemoveBlockCommand: no block data stored");
            return;
        }

        // Re-add the block at its original location
        this.context.blockEnvironment.addBlock(
            this.removedBlock,
            this.originalParentId ?? null,
            this.originalIndex ?? null
        );

        console.log(`⏪ [CMD] Restored block ${this.blockId}`);
    }
}

/**
 * Command: Move a block to a different parent (re-parenting)
 */
export class MoveBlockCommand extends BaseCommand {
    private originalParentId?: string | null;
    private originalIndex?: number;

    constructor(
        private context: CommandContext,
        private blockId: string,
        private newParentId: string | null
    ) {
        super(
            LayoutCommandType.MOVE_BLOCK,
            `Move block ${blockId} to ${newParentId ?? "top-level"}`,
            { blockId, newParentId }
        );
    }

    execute(): void {
        // Store original parent for undo
        this.originalParentId = this.context.blockEnvironment.getParentId(this.blockId);

        // TODO: Store original index within parent's children array

        // Move the block
        this.context.blockEnvironment.moveBlock(this.blockId, this.newParentId);

        console.log(
            `✅ [CMD] Moved block ${this.blockId} from ${this.originalParentId} to ${this.newParentId}`
        );
    }

    undo(): void {
        if (this.originalParentId === undefined) {
            console.warn("Cannot undo MoveBlockCommand: no original parent stored");
            return;
        }

        // Move block back to original parent
        this.context.blockEnvironment.moveBlock(this.blockId, this.originalParentId);

        console.log(`⏪ [CMD] Moved block ${this.blockId} back to ${this.originalParentId}`);
    }
}

/**
 * Command: Resize a block (change width/height)
 */
export class ResizeBlockCommand extends BaseCommand {
    private originalWidget?: GridStackWidget;

    constructor(
        private context: CommandContext,
        private blockId: string,
        private newWidth: number,
        private newHeight: number
    ) {
        super(LayoutCommandType.RESIZE_BLOCK, `Resize block ${blockId}`, {
            blockId,
            newWidth,
            newHeight,
        });
    }

    execute(): void {
        // Store original widget dimensions for undo
        this.originalWidget = this.context.gridStack.getWidget(this.blockId);

        if (!this.originalWidget) {
            console.warn(`Cannot resize block ${this.blockId}: widget not found`);
            return;
        }

        // Update widget dimensions
        this.context.gridStack.updateWidget(this.blockId, {
            w: this.newWidth,
            h: this.newHeight,
        });

        console.log(
            `✅ [CMD] Resized block ${this.blockId} to ${this.newWidth}x${this.newHeight}`
        );
    }

    undo(): void {
        if (!this.originalWidget) {
            console.warn("Cannot undo ResizeBlockCommand: no original widget stored");
            return;
        }

        // Restore original dimensions
        this.context.gridStack.updateWidget(this.blockId, {
            w: this.originalWidget.w,
            h: this.originalWidget.h,
        });

        console.log(
            `⏪ [CMD] Restored block ${this.blockId} size to ${this.originalWidget.w}x${this.originalWidget.h}`
        );
    }
}

/**
 * Command: Reposition a block within same parent (change x/y)
 */
export class RepositionBlockCommand extends BaseCommand {
    private originalWidget?: GridStackWidget;

    constructor(
        private context: CommandContext,
        private blockId: string,
        private newX: number,
        private newY: number
    ) {
        super(LayoutCommandType.REPOSITION_BLOCK, `Reposition block ${blockId}`, {
            blockId,
            newX,
            newY,
        });
    }

    execute(): void {
        // Store original widget position for undo
        this.originalWidget = this.context.gridStack.getWidget(this.blockId);

        if (!this.originalWidget) {
            console.warn(`Cannot reposition block ${this.blockId}: widget not found`);
            return;
        }

        // Update widget position
        this.context.gridStack.updateWidget(this.blockId, {
            x: this.newX,
            y: this.newY,
        });

        console.log(`✅ [CMD] Repositioned block ${this.blockId} to (${this.newX}, ${this.newY})`);
    }

    undo(): void {
        if (!this.originalWidget) {
            console.warn("Cannot undo RepositionBlockCommand: no original widget stored");
            return;
        }

        // Restore original position
        this.context.gridStack.updateWidget(this.blockId, {
            x: this.originalWidget.x,
            y: this.originalWidget.y,
        });

        console.log(
            `⏪ [CMD] Restored block ${this.blockId} position to (${this.originalWidget.x}, ${this.originalWidget.y})`
        );
    }
}

/**
 * Command: Update block content/configuration
 */
export class UpdateBlockCommand extends BaseCommand {
    private originalBlock?: BlockNode;

    constructor(
        private context: CommandContext,
        private blockId: string,
        private updatedContent: BlockNode
    ) {
        super(LayoutCommandType.UPDATE_BLOCK, `Update block ${blockId}`, { blockId });
    }

    execute(): void {
        // Store original block for undo
        this.originalBlock = this.context.blockEnvironment.getBlock(this.blockId);

        if (!this.originalBlock) {
            console.warn(`Cannot update block ${this.blockId}: not found`);
            return;
        }

        // Update the block
        this.context.blockEnvironment.updateBlock(this.blockId, this.updatedContent);

        console.log(`✅ [CMD] Updated block ${this.blockId}`);
    }

    undo(): void {
        if (!this.originalBlock) {
            console.warn("Cannot undo UpdateBlockCommand: no original block stored");
            return;
        }

        // Restore original block
        this.context.blockEnvironment.updateBlock(this.blockId, this.originalBlock);

        console.log(`⏪ [CMD] Restored block ${this.blockId}`);
    }
}

/**
 * Command: Batch multiple commands together
 * Useful for operations that should be treated as a single undo/redo step
 */
export class BatchCommand extends BaseCommand {
    constructor(
        private commands: LayoutCommand[],
        description?: string
    ) {
        super(
            LayoutCommandType.BATCH,
            description || `Batch of ${commands.length} commands`,
            { commandCount: commands.length }
        );
    }

    execute(): void {
        // Execute all commands in order
        for (const command of this.commands) {
            command.execute();
        }

        console.log(`✅ [CMD] Executed batch of ${this.commands.length} commands`);
    }

    undo(): void {
        // Undo all commands in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }

        console.log(`⏪ [CMD] Undid batch of ${this.commands.length} commands`);
    }

    canExecute(): boolean {
        return this.commands.every((cmd) => !cmd.canExecute || cmd.canExecute());
    }

    canUndo(): boolean {
        return this.commands.every((cmd) => !cmd.canUndo || cmd.canUndo());
    }
}
