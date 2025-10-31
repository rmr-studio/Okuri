import { ChildNodeProps } from "@/lib/interfaces/interface";
import { useCallback } from "react";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { Block, BlockNode } from "../../interface/block.interface";
import {
    createContactBlockNode,
    createLayoutContainerNode,
    createNoteNode,
    createProjectBlockNode,
} from "../../util/block/factory/mock.factory";
import { PanelWrapper, QuickActionItem, SlashMenuItem, defaultSlashItems } from "./panel-wrapper";

interface Props extends ChildNodeProps {
    block: Block;
}

const BlockPanel: React.FC<Props> = ({ block, children }) => {
    const { id, type } = block;

    const { getBlock, removeBlock, insertBlock } = useBlockEnvironment();
    const blockNode = getBlock(id);

    const canNest = Boolean(blockNode?.block.type.nesting);
    const organisationId = blockNode?.block.organisationId;

    const handleDelete = useCallback(() => {
        removeBlock(id);
    }, [id, removeBlock]);

    const handleInsertNested = useCallback(
        (item: SlashMenuItem) => {
            if (!canNest || !organisationId) return;

            const newNode = createNodeFromSlashItem(item, organisationId);
            if (!newNode) return;

            insertBlock(newNode, id, "main", null);
        },
        [id, canNest, insertBlock, organisationId]
    );

    if (!blockNode) {
        return (
            <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                Block {id} not found
            </div>
        );
    }

    const title = blockNode.block.type.name ?? blockNode.block.name ?? "Untitled Block";
    const description = blockNode.block.type.description;

    const quickActions: QuickActionItem[] = [
        {
            id: "delete",
            label: "Delete block",
            shortcut: "⌘⌫",
            onSelect: handleDelete,
        },
    ];

    return (
        <PanelWrapper
            id={id}
            title={title}
            description={description}
            slashItems={defaultSlashItems}
            quickActions={quickActions}
            allowInsert={canNest}
            onInsert={canNest ? handleInsertNested : undefined}
            onDelete={handleDelete}
        >
            {children}
        </PanelWrapper>
    );
};

export function createNodeFromSlashItem(
    item: SlashMenuItem,
    organisationId: string
): BlockNode | null {
    switch (item.id) {
        case "CONTACT_CARD":
            return createContactBlockNode(organisationId);
        case "LAYOUT_CONTAINER":
        case "LINE_ITEM":
            return createLayoutContainerNode(organisationId);
        case "TEXT":
        case "BLANK_NOTE":
            return createNoteNode(organisationId);
        case "PROJECT_OVERVIEW":
            return createProjectBlockNode(organisationId);
        default:
            return createNoteNode(organisationId, `New ${item.label}`);
    }
}
