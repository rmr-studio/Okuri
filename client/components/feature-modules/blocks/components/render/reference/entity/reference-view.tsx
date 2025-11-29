"use client";

import { FC, useCallback } from "react";
import { useBlockEnvironment } from "../../../../context/block-environment-provider";
import { useTrackedEnvironment } from "../../../../context/tracked-environment-provider";
import { useBlockHydration } from "../../../../hooks/use-block-hydration";
import { EntityReferenceMetadata, ReferenceItem } from "../../../../interface/block.interface";
import { EntityReferenceItem } from "./reference-item";

interface Props {
    blockId: string;
    item: ReferenceItem;
}

/**
 * Wrapper component for rendering a single entity reference.
 * Handles hydration and removal logic for singleton entity references.
 */
export const EntityView: FC<Props> = ({ blockId, item }) => {
    const { organisationId, getBlock } = useBlockEnvironment();
    const { updateTrackedBlock } = useTrackedEnvironment();
    const { data: hydrationResult, isLoading, error } = useBlockHydration(blockId, organisationId);

    const reference = hydrationResult?.references?.[0];

    // Handle entity removal
    const handleRemove = useCallback(() => {
        const block = getBlock(blockId);
        if (!block) return;

        const updatedPayload: EntityReferenceMetadata = {
            ...(block.block.payload as EntityReferenceMetadata),
            items: [],
        };

        updateTrackedBlock(blockId, {
            ...block,
            block: {
                ...block.block,
                payload: updatedPayload,
            },
        });
    }, [blockId, getBlock, updateTrackedBlock]);

    return (
        <EntityReferenceItem
            id={item.id}
            item={item}
            reference={reference}
            isLoading={isLoading}
            error={error}
            variant="singleton"
            onRemove={handleRemove}
        />
    );
};
