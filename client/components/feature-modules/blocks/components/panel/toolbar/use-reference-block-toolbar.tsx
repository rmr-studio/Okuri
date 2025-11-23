/**
 * Hook for creating toolbar actions for reference blocks
 *
 * This hook provides the "Select Entities" toolbar action for reference blocks,
 * allowing users to select entities to reference from a modal dialog.
 */

import { useState } from "react";
import { Users } from "lucide-react";
import { CustomToolbarAction } from "./panel-toolbar";
import { EntitySelectorModal, ReferenceItem } from "../../modals/entity-selector-modal";
import { useBlockEnvironment } from "../../../context/block-environment-provider";
import { useTrackedEnvironment } from "../../../context/tracked-environment-provider";
import { useQueryClient } from "@tanstack/react-query";

export interface UseReferenceBlockToolbarProps {
    blockId: string;
    entityType: string; // CLIENT, ORGANISATION, etc.
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
export function useReferenceBlockToolbar({
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

        // Update block metadata with new items
        const updatedPayload = {
            ...block.payload,
            items: items,
        };

        updateTrackedBlock(blockId, {
            ...block,
            payload: updatedPayload,
        });

        // Invalidate hydration cache to trigger re-fetch with new entities
        queryClient.invalidateQueries(["block-hydration", blockId]);

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
