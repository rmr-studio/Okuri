"use client";

import { FC, useState, useEffect } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/components/provider/auth-context";
import { fetchOrganisationClients } from "@/components/feature-modules/client/service/client.service";

/**
 * Reference item representing an entity to be referenced in a block.
 */
export interface ReferenceItem {
    type: string; // EntityType (CLIENT, ORGANISATION, etc.)
    id: string; // Entity UUID
    labelOverride?: string | null;
    badge?: string | null;
}

/**
 * Entity data for display in the selector.
 */
interface EntityOption {
    id: string;
    name: string;
    type: string;
    secondaryInfo?: string; // Email, status, member count, etc.
    icon?: React.ReactNode;
}

interface EntitySelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (items: ReferenceItem[]) => void;
    entityType: string; // Which entity type to show (CLIENT, ORGANISATION, etc.)
    organisationId: string;
    multiSelect?: boolean; // Allow selecting multiple entities
    excludeIds?: string[]; // Entity IDs to exclude (already selected)
    initialSelection?: ReferenceItem[]; // Pre-selected items
}

/**
 * EntitySelectorModal - Modal for selecting entities to reference in a block.
 *
 * Features:
 * - Search/filter entities by name
 * - Single or multi-select mode
 * - Shows entity type icons and secondary info
 * - Excludes already-selected entities (duplicate prevention)
 * - Supports CLIENT entity type (extensible to others)
 *
 * @example
 * <EntitySelectorModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSelect={(items) => console.log("Selected:", items)}
 *   entityType="CLIENT"
 *   organisationId={orgId}
 *   multiSelect={true}
 * />
 */
export const EntitySelectorModal: FC<EntitySelectorModalProps> = ({
    open,
    onOpenChange,
    onSelect,
    entityType,
    organisationId,
    multiSelect = false,
    excludeIds = [],
    initialSelection = [],
}) => {
    const { session } = useAuth();
    const [entities, setEntities] = useState<EntityOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(initialSelection.map((item) => item.id))
    );

    // Fetch entities when modal opens
    useEffect(() => {
        if (!open || !session || !organisationId) return;

        const fetchEntities = async () => {
            setIsLoading(true);
            try {
                // Currently only supports CLIENT entity type
                // TODO: Add support for ORGANISATION, PROJECT, INVOICE, etc.
                if (entityType === "CLIENT") {
                    const clients = await fetchOrganisationClients(session, {
                        id: organisationId,
                    } as any);

                    const options: EntityOption[] = clients.map((client) => ({
                        id: client.id,
                        name: client.name || "Unnamed Client",
                        type: "CLIENT",
                        secondaryInfo: client.contactDetails?.email || client.id,
                        icon: <Users className="size-4" />,
                    }));

                    // Filter out excluded IDs
                    const filteredOptions = options.filter(
                        (opt) => !excludeIds.includes(opt.id)
                    );

                    setEntities(filteredOptions);
                }
            } catch (error) {
                console.error("Failed to fetch entities:", error);
                setEntities([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntities();
    }, [open, session, organisationId, entityType, excludeIds]);

    // Handle entity selection
    const handleEntityToggle = (entityId: string) => {
        if (multiSelect) {
            const newSelection = new Set(selectedIds);
            if (newSelection.has(entityId)) {
                newSelection.delete(entityId);
            } else {
                newSelection.add(entityId);
            }
            setSelectedIds(newSelection);
        } else {
            // Single select - immediately select and close
            const entity = entities.find((e) => e.id === entityId);
            if (entity) {
                onSelect([
                    {
                        type: entity.type,
                        id: entity.id,
                        labelOverride: null,
                        badge: null,
                    },
                ]);
                onOpenChange(false);
            }
        }
    };

    // Handle confirm for multi-select
    const handleConfirm = () => {
        const selectedItems: ReferenceItem[] = Array.from(selectedIds).map((id) => {
            const entity = entities.find((e) => e.id === id);
            return {
                type: entity?.type || entityType,
                id,
                labelOverride: null,
                badge: null,
            };
        });

        onSelect(selectedItems);
        onOpenChange(false);
    };

    // Format entity type for display
    const formattedEntityType = entityType
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder={`Search ${formattedEntityType.toLowerCase()}s...`}
            />
            <CommandList>
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <CommandEmpty>No {formattedEntityType.toLowerCase()}s found.</CommandEmpty>
                        <CommandGroup heading={`Select ${formattedEntityType}`}>
                            {entities.map((entity) => {
                                const isSelected = selectedIds.has(entity.id);

                                return (
                                    <CommandItem
                                        key={entity.id}
                                        onSelect={() => handleEntityToggle(entity.id)}
                                        className="gap-3"
                                    >
                                        {multiSelect && (
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleEntityToggle(entity.id)}
                                            />
                                        )}
                                        {entity.icon}
                                        <div className="flex flex-col items-start flex-1">
                                            <span className="font-medium">{entity.name}</span>
                                            {entity.secondaryInfo && (
                                                <span className="text-xs text-muted-foreground">
                                                    {entity.secondaryInfo}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="secondary">{entity.type}</Badge>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </>
                )}
            </CommandList>

            {/* Show confirm button for multi-select */}
            {multiSelect && entities.length > 0 && (
                <div className="border-t p-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        {selectedIds.size} selected
                    </span>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        size="sm"
                    >
                        Confirm Selection
                    </Button>
                </div>
            )}
        </CommandDialog>
    );
};
