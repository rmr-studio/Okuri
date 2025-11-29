import {
    isEntityReferenceMetadata,
    ReferenceNode,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { EntityType } from "@/lib/types/types";
import { FC, useMemo } from "react";
import { useBlockEnvironment } from "../../../../context/block-environment-provider";
import { useTrackedEnvironment } from "../../../../context/tracked-environment-provider";
import { UseEntityReferenceToolbar } from "../../../../hooks/use-entity-references";
import { getTitle } from "../../../../util/block/block.util";
import { PanelWrapper } from "../../../panel/panel-wrapper";
import { EntityReferenceEmptyState } from "./empty-state";
import { EntityReferenceList } from "./reference-list";
import { EntityView } from "./reference-view";

interface Props {
    node: ReferenceNode;
}

export const EntityReference: FC<Props> = ({ node }) => {
    const { removeTrackedBlock } = useTrackedEnvironment();
    const { organisationId } = useBlockEnvironment();

    // We have already verified payload status. Just need to narrow the type here aswell.
    if (!isEntityReferenceMetadata(node.block.payload)) return null;

    const { items, listType } = node.block.payload;
    const { block } = node;
    const { id, type } = block;

    const itemCount = items.length;

    // Get entity reference toolbar actions and modal
    // Use listType if set, otherwise default to CLIENT
    const { customActions, modal } = UseEntityReferenceToolbar({
        blockId: id,
        entityType: listType || EntityType.CLIENT,
        currentItems: items || [],
        multiSelect: true,
    });

    // Quick actions for the block
    const quickActions = useMemo(
        () => [
            {
                id: "delete",
                label: "Delete block",
                shortcut: "⌘⌫",
                onSelect: () => removeTrackedBlock(id),
            },
        ],
        [id, removeTrackedBlock]
    );

    const title = getTitle(node);

    // Determine content based on item count
    let content: React.ReactNode;

    // Case 1: Empty state (0 items)
    if (itemCount === 0) {
        content = <EntityReferenceEmptyState />;
    }
    // Case 2: Singleton rendering (1 item)
    else if (itemCount === 1) {
        content = <EntityView blockId={id} item={items[0]} />;
    }
    // Case 3: List rendering (2+ items)
    else {
        content = <EntityReferenceList blockId={id} items={items} />;
    }

    return (
        <>
            <PanelWrapper
                id={id}
                title={title}
                description={type.description}
                quickActions={quickActions}
                allowInsert={false}
                onDelete={() => removeTrackedBlock(id)}
                customActions={customActions}
            >
                {content}
            </PanelWrapper>
            {modal}
        </>
    );
};
