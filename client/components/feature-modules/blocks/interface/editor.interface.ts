/* -------------------------------------------------------------------------- */
/*                              Type Definitions                              */
/* -------------------------------------------------------------------------- */

import { ChildNodeProps } from "@/lib/interfaces/interface";
import { BlockNode, BlockTree } from "./block.interface";
import { BlockTreeLayout } from "./layout.interface";

/** Metadata describing the environment itself. */
export interface EditorEnvironmentMetadata {
    name: string;
    description?: string;
    organisationId: string;
    createdAt: string;
    updatedAt: string;
}

export interface DetachResult {
    success: boolean;
    root: BlockNode;
    detachedNode: BlockNode | null;
}

export interface InsertResult<T> {
    payload: T;
    success: boolean;
}

/**
 * Internal environment model used by the provider.
 * - `trees` holds each top-level block tree.
 * - `hierarchy` maps blockId -> parentBlockId (null for roots).
 * - `treeIndex` maps blockId -> owning tree root id.
 * - `layouts` and `uiMetadata` store per-block editor state.
 */
export interface EditorEnvironment {
    trees: BlockTree[];
    metadata: EditorEnvironmentMetadata;
    // Lookup for parent IDs (null for top-level)
    hierarchy: Map<string, string | null>;
    // Lookup for which root a node belongs to
    treeIndex: Map<string, string>;
}

export interface BlockEnvironmentProviderProps extends ChildNodeProps {
    organisationId: string;
    initialTrees?: BlockTree[];

    /** Full layout object with ID tracking for persistence */
    blockTreeLayout?: BlockTreeLayout;
}

/** Context contract exposed to consumers. */
export interface BlockEnvironmentContextValue {
    environment: EditorEnvironment;
    organisationId: string;

    /** Full layout object with metadata */
    blockTreeLayout?: BlockTreeLayout;
    /** Layout ID for persistence operations */
    layoutId?: string;
    isInitialized: boolean;
    setIsInitialized(value: boolean): void;
    addBlock(tree: BlockNode, parentId?: string | null): string;
    removeBlock(blockId: string): void;
    updateBlock(blockId: string, updatedContent: BlockNode): void;

    getBlock(blockId: string): BlockNode | undefined;
    getTrees(): BlockTree[];

    insertBlock(child: BlockNode, parentId: string, index: number | null): string;
    moveBlock(blockId: string, targetParentId: string | null): void;

    // Parent Retrieval
    getParentId(blockId: string): string | null;
    /**
     * Retrieves the parent block of a given block ID.
     * Note: The children of the parent block will NOT be populated.
     * @param blockId The ID of the block whose parent is to be retrieved.
     * @returns The parent BlockNode, or null if it has no parent.
     */
    getParent(blockId: string): BlockNode | null;

    // Children Retrieval
    getChildren(blockId: string): string[];
    getDescendants(blockId: string): Record<string, string>;
    isDescendantOf(blockId: string, ancestorId: string): boolean;
    updateHierarchy(blockId: string, newParentId: string | null): void;

    moveBlockUp(blockId: string): void;
    moveBlockDown(blockId: string): void;
    reorderBlock(blockId: string, parentId: string, targetIndex: number): void;

    clear(): void;

    /** Replace the entire environment with a snapshot (used when discarding changes). */
    hydrateEnvironment(snapshot: EditorEnvironment): void;

    /** Capture the current environment state as a detached snapshot. */
    getEnvironmentSnapshot(): EditorEnvironment;
}
