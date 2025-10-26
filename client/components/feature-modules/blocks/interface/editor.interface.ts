/**
 * Editor-specific types for managing block environments.
 *
 * These types extend the core BlockTree schema with editor-specific concerns
 * like layout positions, UI metadata, and workspace organization.
 */

import { BlockTree } from "./block.interface";

/**
 * Represents the entire editor state - a collection of top-level blocks
 * with their layout positions and metadata.
 *
 * An environment could represent:
 * - A client profile page
 * - A project dashboard
 * - An invoice template
 * - Any collection of related blocks
 */
export interface EditorEnvironment {
    /** Unique identifier for this environment (could be page ID, client ID, etc.) */
    id: string;

    /** Organization context */
    organisationId: string;

    /** Top-level blocks in this environment */
    blocks: EditorBlockInstance[];

    /** Metadata about the environment */
    metadata: EditorEnvironmentMetadata;
}

/**
 * Metadata for the editor environment
 */
export interface EditorEnvironmentMetadata {
    /** Display name for the environment */
    name?: string;

    /** Description of the environment's purpose */
    description?: string;

    /** When this environment was created */
    createdAt?: string;

    /** When this environment was last modified */
    updatedAt?: string;

    /** User who created this environment */
    createdBy?: string;

    /** User who last modified this environment */
    updatedBy?: string;
}

/**
 * A block instance in the editor with its layout information.
 * This wraps BlockTree with editor-specific concerns.
 */
export interface EditorBlockInstance {
    /** The block tree (domain data + nested structure) */
    tree: BlockTree;

    /** GridStack layout position for this top-level block */
    layout: EditorLayoutRect;

    /** UI-only metadata (not persisted to Block table) */
    uiMetadata?: EditorBlockUIMetadata;
}

/**
 * GridStack layout coordinates for a block
 */
export interface EditorLayoutRect {
    /** X position in grid columns */
    x: number;

    /** Y position in grid rows */
    y: number;

    /** Width in grid columns */
    w: number;

    /** Height in grid rows */
    h: number;
}

/**
 * UI-only metadata that doesn't get persisted to the server.
 * Used for temporary editor states and customizations.
 */
export interface EditorBlockUIMetadata {
    /** Whether the block is collapsed in the editor */
    collapsed?: boolean;

    /** Whether the block position/size is locked */
    locked?: boolean;

    /** Custom title override (if different from block.name) */
    customTitle?: string;

    /** Custom badge text for visual identification */
    customBadge?: string;

    /** Visual theme variant */
    variant?: "default" | "primary" | "success" | "warning" | "danger";
}

/**
 * Server payload format for persisting an environment.
 * This is what gets sent to/received from the API.
 */
export interface ServerEnvironmentPayload {
    /** Environment ID */
    id: string;

    /** Organization ID */
    organisationId: string;

    /** Block IDs and their layout positions */
    layout: Array<{
        blockId: string;
        position: EditorLayoutRect;
    }>;

    /** Environment metadata */
    metadata: EditorEnvironmentMetadata;
}

/**
 * Options for creating a new block in the editor
 */
export interface CreateBlockOptions {
    /** Block type key (e.g., "contact", "project") */
    typeKey: string;

    /** Optional initial data for the block payload */
    initialData?: Record<string, unknown>;

    /** Optional initial layout position */
    layout?: EditorLayoutRect;

    /** Optional UI metadata */
    uiMetadata?: EditorBlockUIMetadata;
}

/**
 * Options for inserting a nested block into a parent
 */
export interface InsertNestedBlockOptions {
    /** Parent block ID */
    parentId: string;

    /** Slot name in the parent to insert into */
    slotName: string;

    /** The child block tree to insert */
    childTree: BlockTree;

    /** Optional position within the slot */
    position?: number;
}

/**
 * Result of a block operation (for error handling)
 */
export interface BlockOperationResult {
    success: boolean;
    error?: string;
    blockId?: string;
}
