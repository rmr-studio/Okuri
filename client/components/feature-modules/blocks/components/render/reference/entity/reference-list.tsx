"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { FC, useCallback } from "react";
import { useBlockEnvironment } from "../../../../context/block-environment-provider";
import { useTrackedEnvironment } from "../../../../context/tracked-environment-provider";
import { useBlockHydration } from "../../../../hooks/use-block-hydration";
import {
    EntityReferenceMetadata,
    isEntityReferenceMetadata,
    ReferenceItem,
} from "../../../../interface/block.interface";
import { ListPanel } from "../../list/list.container";
import { EntityReferenceItem } from "./reference-item";

interface EntityReferenceListProps {
    blockId: string;
    items: ReferenceItem[];
}

/**
 * Renders multiple entity references in a list format.
 * Follows the ContentBlockList pattern with ListPanel + EntityReferenceItem.
 *
 * Used when an entity reference block contains 2 or more entities.
 */
export const EntityReferenceList: FC<EntityReferenceListProps> = ({ blockId, items }) => {
    const { organisationId, getBlock } = useBlockEnvironment();
    const { updateTrackedBlock } = useTrackedEnvironment();
    const {
        data: hydrationResult,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useBlockHydration(blockId, organisationId);

    // Handle entity removal
    const handleRemoveEntity = useCallback(
        (entityId: string) => {
            const block = getBlock(blockId);
            if (!block) return;

            const { payload } = block.block;
            if (!isEntityReferenceMetadata(payload)) return;

            // Remove entity from items
            const updatedItems = payload.items?.filter((item) => item.id !== entityId) || [];

            // Update block metadata
            const updatedPayload: EntityReferenceMetadata = {
                ...payload,
                items: updatedItems,
            };

            updateTrackedBlock(blockId, {
                ...block,
                block: {
                    ...block.block,
                    payload: updatedPayload,
                },
            });
        },
        [blockId, getBlock, updateTrackedBlock]
    );

    // Retry button for error state
    const retryButton = error ? (
        <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="absolute top-2 right-2"
        >
            <RefreshCw className={`size-3.5 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Retry
        </Button>
    ) : null;

    const references = hydrationResult?.references || [];

    return (
        <ListPanel blockId={blockId} listControls={retryButton}>
            <div className="space-y-3">
                {items.map((item) => {
                    const reference = references.find((ref) => ref.entityId === item.id);

                    return (
                        <EntityReferenceItem
                            key={item.id}
                            id={item.id}
                            item={item}
                            reference={reference}
                            isLoading={isLoading}
                            error={error}
                            variant="list"
                            onRemove={() => handleRemoveEntity(item.id)}
                        />
                    );
                })}
            </div>
        </ListPanel>
    );
};
