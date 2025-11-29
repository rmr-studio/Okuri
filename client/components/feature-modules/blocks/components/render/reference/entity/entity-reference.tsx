import {
    isEntityReferenceMetadata,
    ReferenceNode,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { FC } from "react";
import { EntityReferenceEmptyState } from "./empty-state";
import { EntityReferenceList } from "./reference-list";
import { EntityView } from "./reference-view";

interface Props {
    node: ReferenceNode;
}

export const EntityReference: FC<Props> = ({ node }) => {
    // We have already verified payload status. Just need to narrow the type here aswell.
    if (!isEntityReferenceMetadata(node.block.payload)) return null;

    const { items } = node.block.payload;
    const itemCount = items.length;

    // Case 1: Empty state (0 items)
    if (itemCount === 0) {
        return <EntityReferenceEmptyState />;
    }

    // Case 2: Singleton rendering (1 item)
    if (itemCount === 1) {
        return <EntityView blockId={node.block.id} item={items[0]} />;
    }

    // Case 3: List rendering (2+ items)
    return <EntityReferenceList blockId={node.block.id} items={items} />;
};
