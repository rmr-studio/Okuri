import { Badge } from "@/components/ui/badge";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/lib/types/types";
import {
    BoxIcon,
    CheckSquareIcon,
    FileTextIcon,
    FolderKanbanIcon,
    LayoutGridIcon,
    LinkIcon,
    ListIcon,
    MapPinIcon,
    TypeIcon,
} from "lucide-react";
import { FC } from "react";
import { categorizeBlockTypes, useBlockTypes } from "../../hooks/use-block-types";
import { BlockType } from "../../interface/block.interface";

/**
 * Props for the AddBlockDialog component
 */
export interface AddBlockDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to change the open state */
    onOpenChange: (open: boolean) => void;
    /** Organization ID to fetch block types for */
    organisationId: string;
    /** Optional entity type for contextual filtering */
    entityType?: EntityType;
    /** Callback when a block type is selected */
    onBlockTypeSelect: (blockType: BlockType) => void;
}

/**
 * Dialog component for selecting and adding block types to an entity layout.
 *
 * This component provides a searchable, categorized interface for browsing
 * available block types (both system and custom). It's similar to the demo's
 * AddBlockButton but designed for real entity environments.
 *
 * Features:
 * - Search/filter block types by name or description
 * - Categorized display (Layout, Content, Reference, Custom)
 * - System/custom badges
 * - Icon indicators for each block type
 * - Loading and error states
 *
 * @example
 * ```typescript
 * const [dialogOpen, setDialogOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setDialogOpen(true)}>Add Block</Button>
 *     <AddBlockDialog
 *       open={dialogOpen}
 *       onOpenChange={setDialogOpen}
 *       organisationId={organisationId}
 *       entityType={EntityType.CLIENT}
 *       onBlockTypeSelect={(type) => {
 *         console.log('Selected:', type);
 *         setDialogOpen(false);
 *       }}
 *     />
 *   </>
 * );
 * ```
 */
export const AddBlockDialog: FC<AddBlockDialogProps> = ({
    open,
    onOpenChange,
    organisationId,
    entityType,
    onBlockTypeSelect,
}) => {
    const { data: blockTypes, isLoading, error } = useBlockTypes(organisationId, entityType);
    const availableBlockTypes = blockTypes ?? [];

    // Categorize block types for organized display
    const categories = categorizeBlockTypes(availableBlockTypes);

    const handleSelect = (blockType: BlockType) => {
        onBlockTypeSelect(blockType);
        onOpenChange(false);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search block types..." />
            <CommandList>
                {isLoading && (
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                )}

                {error && (
                    <div className="p-4 text-sm text-destructive">
                        Failed to load block types: {error.message}
                    </div>
                )}

                {!isLoading && !error && availableBlockTypes.length === 0 && (
                    <CommandEmpty>No block types available.</CommandEmpty>
                )}

                {!isLoading && !error && availableBlockTypes.length > 0 && (
                    <>
                        {/* Layout Blocks */}
                        {categories.layout.length > 0 && (
                            <CommandGroup heading="Layout">
                                {categories.layout.map((type) => (
                                    <BlockTypeItem
                                        key={type.id}
                                        blockType={type}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </CommandGroup>
                        )}

                        {/* Content Blocks */}
                        {categories.content.length > 0 && (
                            <CommandGroup heading="Content">
                                {categories.content.map((type) => (
                                    <BlockTypeItem
                                        key={type.id}
                                        blockType={type}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </CommandGroup>
                        )}

                        {/* Reference Blocks */}
                        {categories.reference.length > 0 && (
                            <CommandGroup heading="References">
                                {categories.reference.map((type) => (
                                    <BlockTypeItem
                                        key={type.id}
                                        blockType={type}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </CommandGroup>
                        )}

                        {/* Custom Blocks */}
                        {categories.custom.length > 0 && (
                            <CommandGroup heading="Custom">
                                {categories.custom.map((type) => (
                                    <BlockTypeItem
                                        key={type.id}
                                        blockType={type}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </CommandGroup>
                        )}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
};

/**
 * Individual block type item within the command list
 */
interface BlockTypeItemProps {
    blockType: BlockType;
    onSelect: (blockType: BlockType) => void;
}

const BlockTypeItem: FC<BlockTypeItemProps> = ({ blockType, onSelect }) => {
    const icon = getBlockTypeIcon(blockType.key);

    return (
        <CommandItem onSelect={() => onSelect(blockType)} className="gap-2 cursor-pointer">
            <div className="flex items-center gap-2 flex-1">
                {icon}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{blockType.name}</span>
                        {blockType.system && (
                            <Badge variant="secondary" className="text-xs">
                                System
                            </Badge>
                        )}
                    </div>
                    {blockType.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {blockType.description}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
                        {blockType.key}
                    </p>
                </div>
            </div>
        </CommandItem>
    );
};

/**
 * Returns an appropriate icon for a block type based on its key
 */
function getBlockTypeIcon(key: string): React.ReactNode {
    const iconClass = "size-4 text-muted-foreground";

    // Specific block type icons
    switch (key) {
        case "layout_container":
            return <BoxIcon className={iconClass} />;
        case "project_overview":
            return <FolderKanbanIcon className={iconClass} />;
        case "note":
            return <FileTextIcon className={iconClass} />;
        case "project_task":
            return <CheckSquareIcon className={iconClass} />;
        case "postal_address":
            return <MapPinIcon className={iconClass} />;
        case "block_list":
        case "content_block_list":
            return <ListIcon className={iconClass} />;
        case "block_reference":
        case "entity_reference_list":
            return <LinkIcon className={iconClass} />;
        default:
            // Fallback patterns
            if (key.includes("container")) {
                return <BoxIcon className={iconClass} />;
            }
            if (key.includes("layout")) {
                return <LayoutGridIcon className={iconClass} />;
            }
            if (key.includes("list")) {
                return <ListIcon className={iconClass} />;
            }
            if (key.includes("reference")) {
                return <LinkIcon className={iconClass} />;
            }
            if (key.includes("text") || key.includes("note")) {
                return <FileTextIcon className={iconClass} />;
            }
            // Default icon
            return <TypeIcon className={iconClass} />;
    }
}
