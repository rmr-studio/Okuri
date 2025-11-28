/**
 * Hook for creating toolbar actions for reference blocks
 *
 * This hook provides the "Select Entities" toolbar action for reference blocks,
 * allowing users to select entities to reference from a modal dialog.
 */

import { EntityType } from "@/lib/types/types";
import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { EntitySelectorModal } from "../components/modals/entity-selector-modal";
import { CustomToolbarAction } from "../components/panel/toolbar/panel-toolbar";
import { useBlockEnvironment } from "../context/block-environment-provider";
import { useTrackedEnvironment } from "../context/tracked-environment-provider";
import {
    EntityReferenceMetadata,
    isEntityReferenceMetadata,
    ReferenceItem,
} from "../interface/block.interface";

export interface UseReferenceBlockToolbarProps {
    blockId: string;
    entityType: EntityType;
    currentItems?: ReferenceItem[]; // Currently selected items
    multiSelect?: boolean;
}

export interface UseReferenceBlockToolbarResult {
    customActions: CustomToolbarAction[];
    modal: React.ReactNode;
}

/**
 * Hook to create toolbar actions for reference blocks.
 *
 * Provides:
 * - "Select Entities" button in toolbar
 * - Entity selector modal
 * - Auto-updates block metadata when entities are selected
 * - Invalidates hydration cache to trigger re-fetch
 *
 * @example
 * const { customActions, modal } = useReferenceBlockToolbar({
 *   blockId: "block-uuid",
 *   entityType: "CLIENT",
 *   currentItems: block.payload.items || [],
 *   multiSelect: true,
 * });
 *
 * return (
 *   <>
 *     <PanelToolbar customActions={customActions} {...otherProps} />
 *     {modal}
 *   </>
 * );
 */
export function UseEntityReferenceToolbar({
    blockId,
    entityType,
    currentItems = [],
    multiSelect = true,
}: UseReferenceBlockToolbarProps): UseReferenceBlockToolbarResult {
    const [entitySelectorOpen, setEntitySelectorOpen] = useState(false);
    const { getBlock, organisationId } = useBlockEnvironment();
    const { updateTrackedBlock } = useTrackedEnvironment();
    const queryClient = useQueryClient();

    // Handle entity selection
    const handleEntitySelect = (items: ReferenceItem[]) => {
        const block = getBlock(blockId);
        if (!block) return;
        const { payload } = block.block;

        // Ensure block is an entity reference
        if (!isEntityReferenceMetadata(payload)) return;

        // Update block metadata with new items
        const updatedPayload: EntityReferenceMetadata = {
            ...payload,
            items,
        };

        updateTrackedBlock(blockId, {
            ...block,
            block: {
                ...block.block,
                payload: updatedPayload,
            },
        });

        // Invalidate hydration cache to trigger re-fetch with new entities
        queryClient.invalidateQueries({ queryKey: ["block-hydration", blockId] });

        setEntitySelectorOpen(false);
    };

    // Create custom toolbar action
    const customActions: CustomToolbarAction[] = [
        {
            id: "select-entities",
            icon: <Users className="size-3.5" />,
            label: "Select entities",
            onClick: () => setEntitySelectorOpen(true),
            badge: currentItems.length > 0 ? currentItems.length : undefined,
        },
    ];

    // Create modal
    const modal = (
        <EntitySelectorModal
            open={entitySelectorOpen}
            onOpenChange={setEntitySelectorOpen}
            onSelect={handleEntitySelect}
            entityType={entityType}
            organisationId={organisationId}
            multiSelect={multiSelect}
            excludeIds={currentItems.map((item) => item.id)}
            initialSelection={currentItems}
        />
    );

    return {
        customActions,
        modal,
    };
}
