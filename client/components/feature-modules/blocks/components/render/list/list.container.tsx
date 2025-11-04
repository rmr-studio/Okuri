import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC } from "react";
import { useBlockEnvironment } from "../../../context/block-environment-provider";
import { SlashMenuItem } from "../../../interface/panel.interface";
import { getAllowedChildTypes, getTitle } from "../../../util/block/block.util";
import { createNodeFromSlashItem } from "../../panel/editor-panel";
import { defaultSlashItems, PanelWrapper } from "../../panel/panel-wrapper";

interface Props extends ChildNodeProps {
    blockId: string;
}

/**
 * Lists are seperate entities within the block environment. They manage their own state and rendering.
 * So it is best to have a dedicated panel for list-specific settings and controls.
 * @returns
 */
export const ListPanel: FC<Props> = ({ blockId, children }) => {
    const { getBlock, removeBlock, insertBlock } = useBlockEnvironment();

    const node = getBlock(blockId);
    if (!node) return children;
    const { block } = node;
    const { organisationId, type } = block;

    // Create callback handlers for block toolbar
    const handleDelete = () => removeBlock(blockId);

    const handleInsert = (item: SlashMenuItem) => {
        if (!type.nesting || !organisationId) return;
        const newNode = createNodeFromSlashItem(item, organisationId);
        if (!newNode) return;

        // TODO: Maybe adjust the insertion so it does not go through the same grid creation process
        insertBlock(newNode, blockId, null);
    };

    // Check if this block is inside a list

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
    const availableItems = !!restrictedChildTypes.length
        ? defaultSlashItems.filter((item) => restrictedChildTypes.includes(item.id))
        : defaultSlashItems;

    return (
        <PanelWrapper
            className="p-4 h-full"
            id={blockId}
            title={title}
            description={type.description}
            slashItems={availableItems}
            quickActions={quickActions}
            allowInsert={!!type.nesting}
            onInsert={handleInsert}
            onDelete={handleDelete}
            showResizeHandles={true}
        >
            {children}
        </PanelWrapper>
    );
};
