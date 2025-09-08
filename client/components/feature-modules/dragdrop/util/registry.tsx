// dragdrop/registry.tsx
import { BlockRegistry } from "./types";

export const DragRegistry: BlockRegistry = {
    // LEAF
    displayBlock: {
        label: "Display Block",
        render: (id, data) => <div className="bg-blue-100 p-2 rounded border">Block {id}</div>,
        behaviors: { draggable: true, resizable: true, nestable: false },
        validParents: ["containerBlock", "verticalContainerBlock", "dashboard", "invoicePage"],
    },

    // CONTAINERS (render handled by ResizableContainer)
    containerBlock: {
        label: "Horizontal Container",
        behaviors: { draggable: true, resizable: true, nestable: true },
        validChildren: [
            "displayBlock",
            "containerBlock",
            "verticalContainerBlock",
            "dashboardWidget",
        ],
        direction: "row",
    },
    verticalContainerBlock: {
        label: "Vertical Container",
        behaviors: { draggable: true, resizable: true, nestable: true },
        validChildren: ["displayBlock", "containerBlock", "dashboardWidget"],
        direction: "column",
    },

    // Dashboard (container-like)
    dashboard: {
        label: "Dashboard",
        behaviors: { nestable: true, resizable: true },
        validChildren: ["dashboardWidget"],
        direction: "row",
    },
    dashboardWidget: {
        label: "Dashboard Widget",
        render: (id, data) => (
            <div className="bg-green-100 p-2 rounded border">{data?.title || `Widget ${id}`}</div>
        ),
        validParents: ["dashboard", "containerBlock", "verticalContainerBlock"],
        behaviors: { resizable: true, sortable: true, draggable: true },
    },

    // Example invoice container/page (optional for your app)
    invoicePage: {
        label: "Invoice Page",
        behaviors: { nestable: true, resizable: true },
        validChildren: ["displayBlock"],
        direction: "column",
    },
};
