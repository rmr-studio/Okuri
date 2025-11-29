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
import { TypeOption } from "../components/modals/type-picker-modal";
import { BlockType } from "../interface/block.interface";

/**
 * Converts BlockType array to TypeOption array for the type picker
 */
export function blockTypesToOptions(blockTypes: BlockType[]): TypeOption[] {
    return blockTypes.map((blockType) => ({
        value: blockType.key,
        label: blockType.name,
        description: blockType.description,
        icon: getBlockTypeIcon(blockType.key),
    }));
}

/**
 * Returns an appropriate icon component for a block type based on its key
 */
function getBlockTypeIcon(key: string): React.ComponentType<{ className?: string }> {
    // Specific block type icons
    switch (key) {
        case "layout_container":
            return BoxIcon;
        case "project_overview":
            return FolderKanbanIcon;
        case "note":
            return FileTextIcon;
        case "project_task":
            return CheckSquareIcon;
        case "postal_address":
            return MapPinIcon;
        case "block_list":
        case "content_block_list":
            return ListIcon;
        case "block_reference":
        case "entity_reference_list":
        case "entity_reference":
            return LinkIcon;
        default:
            // Fallback patterns
            if (key.includes("container")) {
                return BoxIcon;
            }
            if (key.includes("layout")) {
                return LayoutGridIcon;
            }
            if (key.includes("list")) {
                return ListIcon;
            }
            if (key.includes("reference")) {
                return LinkIcon;
            }
            if (key.includes("text") || key.includes("note")) {
                return FileTextIcon;
            }
            // Default icon
            return TypeIcon;
    }
}
