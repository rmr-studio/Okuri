// dragdrop/registry.tsx
import { BlockDataMap, BlockRegistry, DropValidation } from "./types";

export const DragRegistry: BlockRegistry = {
    // LEAF BLOCKS
    displayBlock: {
        label: "Display Block",
        behaviors: { draggable: true, resizable: true },
        validParents: ["containerBlock", "verticalContainerBlock", "dashboard", "invoicePage"],
        render: (id: string | number, data?: BlockDataMap["displayBlock"]) => (
            <div className="p-4 bg-blue-100 rounded shadow-sm border">
                <h3 className="font-medium">{data?.title || `Block ${id}`}</h3>
                <p className="text-sm text-gray-600 mt-1">Display content here</p>
            </div>
        ),
        renderOverlay: (id: string | number, data?: BlockDataMap["displayBlock"]) => (
            <div className="p-4 bg-blue-200 rounded shadow-lg border opacity-80">
                <h3 className="font-medium">{data?.title || `Block ${id}`}</h3>
            </div>
        ),
    },

    // CONTAINER BLOCKS
    containerBlock: {
        label: "Horizontal Container",
        behaviors: { draggable: true, resizable: true, nestable: true },
        validChildren: [
            "displayBlock",
            "containerBlock",
            "verticalContainerBlock",
            "dashboardWidget",
        ],
        validParents: ["containerBlock", "verticalContainerBlock", "dashboard", "invoicePage"],
        direction: "row",
        render: () => null, // handled by GridBlock component
    },

    verticalContainerBlock: {
        label: "Vertical Container",
        behaviors: { draggable: true, resizable: true, nestable: true },
        validChildren: [
            "displayBlock",
            "containerBlock",
            "verticalContainerBlock",
            "dashboardWidget",
        ],
        validParents: ["containerBlock", "verticalContainerBlock", "dashboard", "invoicePage"],
        direction: "column",
        render: () => null, // handled by GridBlock component
    },

    // DASHBOARD BLOCKS
    dashboard: {
        label: "Dashboard",
        behaviors: { nestable: true, resizable: true },
        validChildren: ["dashboardWidget", "containerBlock", "verticalContainerBlock"],
        direction: "row",
        render: () => null, // handled by GridBlock component
    },

    dashboardWidget: {
        label: "Dashboard Widget",
        behaviors: { resizable: true, sortable: true, draggable: true },
        validParents: ["dashboard", "containerBlock", "verticalContainerBlock"],
        render: (id: string | number, data?: BlockDataMap["dashboardWidget"]) => (
            <div className="bg-green-100 p-4 rounded border shadow-sm">
                <h3 className="font-medium">{data?.title || `Widget ${id}`}</h3>
                {data?.description && (
                    <p className="text-sm text-gray-600 mt-1">{data.description}</p>
                )}
            </div>
        ),
        renderOverlay: (id: string | number, data?: BlockDataMap["dashboardWidget"]) => (
            <div className="bg-green-200 p-4 rounded border shadow-lg opacity-80">
                <h3 className="font-medium">{data?.title || `Widget ${id}`}</h3>
            </div>
        ),
    },

    // INVOICE BLOCKS
    invoicePage: {
        label: "Invoice Page",
        behaviors: { nestable: true, resizable: true },
        validChildren: ["displayBlock", "containerBlock", "verticalContainerBlock"],
        direction: "column",
        render: () => null, // handled by GridBlock component
    },
};

/**
 * Validates if a block can be dropped on a target
 */
export function validateDrop(
    sourceType: string,
    targetType: string,
    sourceId: string | number,
    targetId: string | number
): DropValidation {
    // Can't drop on self
    if (sourceId === targetId) {
        return { isValid: false, reason: "Cannot drop on self" };
    }

    const sourceConfig = DragRegistry[sourceType];
    const targetConfig = DragRegistry[targetType];

    if (!sourceConfig || !targetConfig) {
        return { isValid: false, reason: "Unknown block type" };
    }

    // Check if target accepts this source type
    if (targetConfig.validChildren && !targetConfig.validChildren.includes(sourceType)) {
        return {
            isValid: false,
            reason: `Target does not accept ${sourceType} blocks`,
        };
    }

    // Check if source can be dropped on this target type
    if (sourceConfig.validParents && !sourceConfig.validParents.includes(targetType)) {
        return {
            isValid: false,
            reason: `Source cannot be dropped on ${targetType}`,
        };
    }

    // Check if target is nestable
    if (!targetConfig.behaviors?.nestable) {
        return { isValid: false, reason: "Target is not nestable" };
    }

    return { isValid: true };
}

/**
 * Gets the default data for a block type
 */
export function getDefaultBlockData(type: string): any {
    switch (type) {
        case "displayBlock":
            return { title: "New Display Block" };
        case "dashboardWidget":
            return { title: "New Widget", description: "Widget description" };
        case "containerBlock":
        case "verticalContainerBlock":
        case "dashboard":
        case "invoicePage":
            return {};
        default:
            return {};
    }
}
