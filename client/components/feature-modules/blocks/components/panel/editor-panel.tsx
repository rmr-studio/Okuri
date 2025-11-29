import { ReactNode, useCallback } from "react";
import {
    BlockNode,
    isEntityReferenceMetadata,
    isReferenceNode,
} from "../../interface/block.interface";
import { SlashMenuItem } from "../../interface/panel.interface";
import { WrapElementProvider } from "../../interface/render.interface";
import { getAllowedChildTypes, getTitle } from "../../util/block/block.util";
import {
    createLayoutContainerNode,
    createNoteNode,
    createProjectBlockNode,
} from "../../util/block/factory/mock.factory";
import { UseEntityReferenceToolbar } from "../../hooks/use-entity-references";
import { PanelWrapper, defaultSlashItems } from "./panel-wrapper";

interface EditorPanelCallackProps {
    getBlock: (id: string) => BlockNode | undefined;
    insertBlock: (node: BlockNode, parentId: string, index: number | null) => void;
    removeBlock: (id: string) => void;
    getParent: (id: string) => BlockNode | null;
}

export const editorPanel = ({
    getBlock,
    insertBlock,
    removeBlock,
    getParent,
}: EditorPanelCallackProps) => {
    const wrapper = useCallback(
        ({ children, content, widget }: WrapElementProvider): ReactNode => {
            // Get associated node from block environment
            const node = getBlock(content.id);
            if (!node) return children;

            const { block } = node;
            const { id, organisationId, type } = block;

            // Create callback handlers for block toolbar
            const handleDelete = () => removeBlock(id);

            const handleInsert = (item: SlashMenuItem) => {
                if (!type.nesting || !organisationId) return;
                const newNode = createNodeFromSlashItem(item, organisationId);
                if (!newNode) return;
                insertBlock(newNode, id, null);
            };

            const quickActions = [
                {
                    id: "delete",
                    label: "Delete block",
                    shortcut: "⌘⌫",
                    onSelect: handleDelete,
                },
            ];

            const title = getTitle(node);

            // Todo: Implement Loading Slash items from Organisation generated block types + System Items
            const restrictedChildTypes = getAllowedChildTypes(node);
            const availableItems = restrictedChildTypes
                ? defaultSlashItems.filter((item) => restrictedChildTypes.includes(item.id))
                : defaultSlashItems;

            // Detect entity reference blocks
            const isEntityRef = isReferenceNode(node) && isEntityReferenceMetadata(block.payload);

            // Create toolbar for entity references
            const entityRefToolbar = isEntityRef
                ? UseEntityReferenceToolbar({
                      blockId: id,
                      entityType: block.payload.entityType || "CLIENT",
                      currentItems: block.payload.items || [],
                      multiSelect: true,
                  })
                : null;

            const customActions = entityRefToolbar?.customActions || [];

            return (
                <>
                    <PanelWrapper
                        id={id}
                        title={title}
                        description={type.description}
                        slashItems={availableItems}
                        quickActions={quickActions}
                        allowInsert={!!type.nesting}
                        onInsert={handleInsert}
                        onDelete={handleDelete}
                        customActions={customActions}
                    >
                        {children}
                    </PanelWrapper>
                    {entityRefToolbar?.modal}
                </>
            );
        },
        [getBlock, insertBlock, removeBlock, getParent]
    );

    return { wrapper };
};

export function createNodeFromSlashItem(
    item: SlashMenuItem,
    organisationId: string
): BlockNode | null {
    switch (item.id) {
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
