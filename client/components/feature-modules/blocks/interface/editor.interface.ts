/* -------------------------------------------------------------------------- */
/*                              Type Definitions                              */
/* -------------------------------------------------------------------------- */

import { ChildNodeProps } from "@/lib/interfaces/interface";
import { BlockNode, BlockTree, GridRect } from "./block.interface";

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
    trees: BlockTree[];
    // Lookup for parent block IDs (null for top-level)
    hierarchy: Map<string, string | null>;
    // Lookup for which tree a block belongs to
    treeIndex: Map<string, string>;
    // Lookup for current block layouts in the editor
    layouts: Map<string, GridRect>;
    metadata: EditorEnvironmentMetadata;
}

export interface BlockEnvironmentProviderProps extends ChildNodeProps {
    organisationId: string;
    initialTrees?: BlockTree[];
}

/** Context contract exposed to consumers. */
export interface BlockEnvironmentContextValue {
    environment: EditorEnvironment;
    addBlock(tree: BlockNode, parentId?: string | null): string;
    removeBlock(blockId: string): void;
    updateBlock(blockId: string, updatedContent: BlockNode): void;
    updateLayout(blockId: string, updatedDimensions: GridRect): void;

    getBlock(blockId: string): BlockNode | undefined;
    getTrees(): BlockTree[];

    insertBlock(child: BlockNode, parentId: string, slotName: string, index: number | null): string;
    moveBlock(
        blockId: string,
        targetParentId: string | null,
        targetSlot?: string,
        layoutOverride?: GridRect
    ): void;

    getParent(blockId: string): string | null;
    getChildren(blockId: string, slotName?: string): string[];
    getDescendants(blockId: string): string[];
    isDescendantOf(blockId: string, ancestorId: string): boolean;
    updateHierarchy(blockId: string, newParentId: string | null): void;

    clear(): void;
}
