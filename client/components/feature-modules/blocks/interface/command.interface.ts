import { GridStackOptions, GridStackWidget } from "gridstack";
import { BlockNode } from "./block.interface";
import { EditorEnvironment } from "./editor.interface";

/**
 * Snapshot of the entire layout state at a point in time
 * Used for rollback and conflict resolution
 */
export interface LayoutSnapshot {
    /** BlockEnvironment state (structural - hierarchy, trees, etc.) */
    blockEnvironment: EditorEnvironment;

    /** GridStack layout (positioning, sizing, nesting) */
    gridLayout: GridStackOptions;

    /** Timestamp when snapshot was created */
    timestamp: number;

    /** Version number from backend (for optimistic locking) */
    version: number;
}

/**
 * Base interface for all layout commands
 * Implements the Command Pattern for undo/redo functionality
 */
export interface LayoutCommand {
    /** Unique identifier for this command */
    id: string;

    /** Type of command for categorization and filtering */
    type: LayoutCommandType;

    /** Human-readable description for UI display */
    description: string;

    /** Timestamp when command was created */
    timestamp: number;

    /** Execute the command (forward operation) */
    execute(): void;

    /** Undo the command (reverse operation) */
    undo(): void;

    /** Optional: Check if command can be executed */
    canExecute?(): boolean;

    /** Optional: Check if command can be undone */
    canUndo?(): boolean;

    /** Metadata for debugging and analytics */
    metadata?: Record<string, unknown>;
}

/**
 * Command types categorize different kinds of operations
 */
export enum LayoutCommandType {
    /** Adding a new block to the environment */
    ADD_BLOCK = "ADD_BLOCK",

    /** Removing a block from the environment */
    REMOVE_BLOCK = "REMOVE_BLOCK",

    /** Moving a block to a different parent (re-parenting) */
    MOVE_BLOCK = "MOVE_BLOCK",

    /** Resizing a block (width/height change) */
    RESIZE_BLOCK = "RESIZE_BLOCK",

    /** Repositioning a block within same parent (x/y change) */
    REPOSITION_BLOCK = "REPOSITION_BLOCK",

    /** Updating block content/configuration */
    UPDATE_BLOCK = "UPDATE_BLOCK",

    /** Batch operation containing multiple commands */
    BATCH = "BATCH",
}

/**
 * Categorizes commands as structural or layout-only
 */
export type CommandCategory = "structural" | "layout";

/**
 * Helper to determine if a command type is structural
 */
export function isStructuralCommand(type: LayoutCommandType): boolean {
    return [
        LayoutCommandType.ADD_BLOCK,
        LayoutCommandType.REMOVE_BLOCK,
        LayoutCommandType.MOVE_BLOCK,
    ].includes(type);
}

/**
 * Helper to get category from command type
 */
export function getCommandCategory(type: LayoutCommandType): CommandCategory {
    return isStructuralCommand(type) ? "structural" : "layout";
}

/**
 * Context provided to commands for execution
 * Contains all necessary providers and utilities
 */
export interface CommandContext {
    /** BlockEnvironment operations */
    blockEnvironment: {
        addBlock: (block: BlockNode, parentId?: string | null, index?: number | null) => string;
        removeBlock: (blockId: string) => void;
        moveBlock: (blockId: string, targetParentId: string | null) => void;
        updateBlock: (blockId: string, updatedContent: BlockNode) => void;
        getBlock: (blockId: string) => BlockNode | undefined;
        getParentId: (blockId: string) => string | null;
    };

    /** GridStack operations */
    gridStack: {
        updateWidget: (id: string, widget: Partial<GridStackWidget>) => void;
        getWidget: (id: string) => GridStackWidget | undefined;
    };
}

/**
 * Configuration for the command history system
 */
export interface CommandHistoryConfig {
    /** Maximum number of commands to keep in history */
    maxHistorySize?: number;

    /** Enable automatic command merging (e.g., multiple resize events) */
    enableMerging?: boolean;

    /** Time window for merging similar commands (ms) */
    mergingWindow?: number;
}

/**
 * State of the command history
 */
export interface CommandHistoryState {
    /** Stack of executed commands (for undo) */
    undoStack: LayoutCommand[];

    /** Stack of undone commands (for redo) */
    redoStack: LayoutCommand[];

    /** Current snapshot (last saved state) */
    currentSnapshot: LayoutSnapshot | null;

    /** Pending snapshot (current working state before save) */
    pendingSnapshot: LayoutSnapshot | null;

    /** Whether there are unsaved changes */
    hasUnsavedChanges: boolean;
}

/**
 * Conflict resolution options when save fails due to version mismatch
 */
export interface ConflictResolution {
    /** What action to take */
    action: "keep-mine" | "use-theirs" | "review" | "cancel";

    /** Optional: User's decision after review */
    reviewDecision?: "keep-mine" | "use-theirs";
}

/**
 * Response from backend when saving layout
 */
export interface SaveLayoutResponse {
    /** Whether save was successful */
    success: boolean;

    /** New version number after successful save */
    newVersion?: number;

    /** Whether there was a conflict (version mismatch) */
    conflict?: boolean;

    /** Latest layout from backend (if conflict) */
    latestLayout?: GridStackOptions;

    /** Latest environment from backend (if conflict) */
    latestEnvironment?: EditorEnvironment;

    /** Version of the conflicting layout */
    latestVersion?: number;

    /** Who made the conflicting change */
    lastModifiedBy?: string;

    /** When the conflicting change was made */
    lastModifiedAt?: string;

    /** Error message if save failed */
    error?: string;
}
