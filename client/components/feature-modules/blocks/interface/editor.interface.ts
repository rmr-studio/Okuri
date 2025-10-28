/* -------------------------------------------------------------------------- */
/*                              Type Definitions                              */
/* -------------------------------------------------------------------------- */

import { Block, BlockTree } from "./block.interface";

/** GridStack layout rectangle for a block widget. */
export interface EditorLayoutRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** UI-only metadata kept locally by the editor (not persisted). */
export interface EditorBlockUIMetadata {
    collapsed?: boolean;
    locked?: boolean;
}

/** Wrapper for a block tree plus editor-specific layout data. */

export interface RenderedItem {
    id: string;
    uiMetadata?: EditorBlockUIMetadata;
    layout: EditorLayoutRect;
}

export interface RenderedTree extends RenderedItem {
    tree: BlockTree;
}

export interface RenderedBlock extends RenderedItem {
    block: Block;
}

/** Metadata describing the environment itself. */
export interface EditorEnvironmentMetadata {
    name: string;
    description?: string;
    organisationId: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Internal environment model used by the provider.
 * - `trees` holds each top-level block tree.
 * - `hierarchy` maps blockId -> parentBlockId (null for roots).
 * - `treeIndex` maps blockId -> owning tree root id.
 * - `layouts` and `uiMetadata` store per-block editor state.
 */
export interface EditorEnvironment {
    trees: RenderedTree[];
    hierarchy: Map<string, string | null>;
    treeIndex: Map<string, string>;
    layouts: Map<string, EditorLayoutRect>;
    uiMetadata: Map<string, EditorBlockUIMetadata>;
    metadata: EditorEnvironmentMetadata;
}

/** Context contract exposed to consumers. */
export interface BlockEnvironmentContextValue {
    environment: EditorEnvironment;

    addBlock(tree: BlockTree, layout?: EditorLayoutRect, parentId?: string | null): string;
    removeBlock(blockId: string): void;
    updateBlock(blockId: string, tree: BlockTree): void;
    updateLayout(blockId: string, layout: EditorLayoutRect): void;

    getBlock(blockId: string): RenderedBlock | undefined;
    getAllBlocks(): RenderedBlock[];
    getTrees(): RenderedTree[];

    insertNestedBlock(
        parentId: string,
        slotName: string,
        childTree: BlockTree,
        layout?: EditorLayoutRect
    ): string;
    promoteToTopLevel(blockId: string, layout?: EditorLayoutRect): void;
    moveBlock(
        blockId: string,
        targetParentId: string | null,
        targetSlot?: string,
        layout?: EditorLayoutRect
    ): void;

    getParent(blockId: string): string | null;
    getChildren(blockId: string, slotName?: string): string[];
    getDescendants(blockId: string): string[];
    isDescendantOf(blockId: string, ancestorId: string): boolean;
    updateHierarchy(blockId: string, newParentId: string | null): void;

    updateUIMetadata(blockId: string, metadata: Partial<EditorBlockUIMetadata>): void;
    clear(): void;
}
