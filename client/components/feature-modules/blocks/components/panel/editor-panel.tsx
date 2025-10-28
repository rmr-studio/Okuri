import { useMemo } from "react";
import { z } from "zod";
import { createRenderElement } from "../../../render/util/render-element.registry";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import {
    createContactBlockTree,
    createNoteBlockTree,
    createProjectBlockTree,
} from "../../util/block/factory/block.factory";
import { RenderBlock } from "../render";
import { PanelWrapper, QuickActionItem, SlashMenuItem, defaultSlashItems } from "./panel-wrapper";

/**
 * Schema for EditorPanel widget props
 */
const EditorPanelSchema = z.object({
    blockId: z.string(),
});

/**
 * EditorPanel widget component - renders a block with panel UI chrome
 *
 * This component:
 * - Wraps blocks in PanelWrapper (provides toolbar, title, actions)
 * - Renders block content via RenderBlock
 * - Handles nesting (recursively renders children if block allows nesting)
 * - Provides delete, duplicate, and insert operations
 */
const EditorPanelWidget: React.FC<z.infer<typeof EditorPanelSchema>> = ({ blockId }) => {
    const { getBlock, removeBlock, insertBlock, updateBlock, getChildren, addBlock } =
        useBlockEnvironment();

    const blockInstance = getBlock(blockId);

    // Get top-level blocks for sibling insertion
    const topLevelBlocks = getTopLevelBlocks();
    const isTopLevel = useMemo(() => {
        return topLevelBlocks.some((b) => b.tree.root.block.id === blockId);
    }, [topLevelBlocks, blockId]);

    if (!blockInstance) {
        return (
            <div className="p-4 text-center text-muted-foreground">Block {blockId} not found</div>
        );
    }

    const { tree, uiMetadata } = blockInstance;

    // Determine if block can nest based on BlockType.nesting
    const canNest = Boolean(tree.root.block.type.nesting);

    // Get nested children IDs (from hierarchy, not BlockTree)
    const childrenIds = canNest ? getChildren(blockId) : [];

    // Get title and description from BlockType (as per Q3 answer)
    const title = tree.root.block.type.name ?? tree.root.block.name ?? "Untitled Block";
    const description = tree.root.block.type.description;

    /**
     * Handle block deletion
     */
    const handleDelete = () => {
        removeBlock(blockId);
    };

    /**
     * Handle inserting nested block
     */
    const handleInsertNested = (item: SlashMenuItem) => {
        // Create a new block from the slash item
        const newTree = createBlockTreeFromSlashItem(item);
        if (!newTree) return;

        // Insert as nested child in "main" slot
        insertNestedBlock(blockId, "main", newTree);
    };

    /**
     * Handle inserting sibling block (only for top-level blocks)
     */
    const handleInsertSibling = (item: SlashMenuItem) => {
        if (!isTopLevel) return;

        const newTree = createBlockTreeFromSlashItem(item);
        if (!newTree) return;

        // Find current block's position
        const currentIndex = topLevelBlocks.findIndex((b) => b.tree.root.block.id === blockId);

        // Calculate layout position (below current block)
        const currentLayout = blockInstance.layout;
        const newLayout = {
            x: 0,
            y: currentLayout.y + currentLayout.h + 1,
            w: 12,
            h: 8,
        };

        // Add as top-level block
        addBlock(newTree, newLayout, null);
    };

    /**
     * Handle block duplication
     */
    const handleDuplicate = () => {
        // TODO Implement tree/block duplication logic
        alert("Duplicate block feature not yet implemented.");
    };

    /**
     * Quick actions menu
     */
    const quickActions: QuickActionItem[] = [
        {
            id: "duplicate",
            label: "Duplicate block",
            shortcut: "⌘D",
            onSelect: handleDuplicate,
        },
        {
            id: "delete",
            label: "Delete block",
            shortcut: "⌘⌫",
            onSelect: handleDelete,
        },
    ];

    /**
     * Render nested children recursively
     */
    const nestedContent =
        canNest && childrenIds.length > 0 ? (
            <div className="space-y-4">
                {childrenIds.map((childId) => (
                    <EditorPanelWidget key={childId} blockId={childId} />
                ))}
            </div>
        ) : null;

    return (
        <PanelWrapper
            id={blockId}
            title={title}
            description={description}
            slashItems={defaultSlashItems}
            quickActions={quickActions}
            allowInsert={canNest}
            onInsert={canNest ? handleInsertNested : undefined}
            onInsertSibling={isTopLevel ? handleInsertSibling : undefined}
            onDelete={handleDelete}
            nested={nestedContent}
        >
            <RenderBlock tree={tree} display={tree.root.block.type.display.render} />
        </PanelWrapper>
    );
};

/**
 * Registry for editor panel renderer
 */
export const editorPanelRegistry = {
    EDITOR_PANEL: createRenderElement({
        type: "EDITOR_PANEL",
        name: "Block Panel",
        description: "Editable block with optional nesting capabilities",
        category: "BLOCK",
        schema: EditorPanelSchema,
        component: EditorPanelWidget,
    }),
};

/**
 * Helper function to create a BlockTree from a slash menu item
 */
function createBlockTreeFromSlashItem(item: SlashMenuItem): any {
    // Use demo org ID - in production, this would come from context/user
    const orgId = "demo-org-12345";

    switch (item.id) {
        case "CONTACT_CARD":
            return createContactBlockTree(orgId);
        case "LAYOUT_CONTAINER":
        case "LINE_ITEM":
            return createProjectBlockTree(orgId);
        case "TEXT":
        case "BLANK_NOTE":
            return createNoteBlockTree(orgId);
        default:
            return createNoteBlockTree(orgId, `New ${item.label}`);
    }
}
