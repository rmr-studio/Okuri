import { BlockRenderStructure } from "@/components/feature-modules/blocks/interface/block.interface";

export const contactDisplay: BlockRenderStructure = {
    version: 1,
    layoutGrid: {
        cols: 12,
        rowHeight: 40,
        width: 1200,
        height: 800,
        items: [
            {
                id: "c_card",
                sm: { x: 0, y: 0, width: 12, height: 6, locked: true },
                lg: { x: 0, y: 0, width: 6, height: 6, locked: true },
            },
            {
                id: "addr_list",
                sm: { x: 0, y: 6, width: 12, height: 6, locked: true },
                lg: { x: 6, y: 0, width: 6, height: 6, locked: true },
            },
        ],
    },
    components: {
        c_card: {
            id: "c_card",
            type: "CONTACT_CARD",
            props: { avatarShape: "circle" }, // free-form props
            bindings: [
                { prop: "client", source: { type: "DataPath", path: "$.data/client" } },
                { prop: "href", source: { type: "DataPath", path: "$.data/links/profile" } },
                { prop: "avatarUrl", source: { type: "DataPath", path: "$.data/avatarUrl" } },
                {
                    prop: "accounts",
                    source: {
                        type: "RefSlot",
                        slot: "account",
                        presentation: "SUMMARY",
                        fields: ["name", "domain"],
                    },
                },
            ],
            slots: {},
            visible: { op: "EXISTS", left: { kind: "Path", path: "$.data/client/name" } },
            fetchPolicy: "LAZY",
        },
        addr_list: {
            id: "addr_list",
            type: "LINE_ITEM", // in registry: render as InlineOwnedList
            props: { itemComponent: "ADDRESS_CARD" },
            bindings: [
                {
                    prop: "items",
                    source: {
                        type: "RefSlot",
                        slot: "addresses",
                        presentation: "INLINE",
                        expandDepth: 1,
                    },
                },
            ],
            slots: {},
            fetchPolicy: "LAZY",
        },
    },
    theme: { variant: "emphasis", tone: "auto" },
};

export const projectDisplay: BlockRenderStructure = {
    version: 1,
    layoutGrid: {
        cols: 12,
        rowHeight: 40,
        width: 1200,
        height: 1000,
        items: [
            {
                id: "proj_header",
                sm: { x: 0, y: 0, width: 12, height: 4, locked: false },
                lg: { x: 0, y: 0, width: 8, height: 4, locked: false },
            },
            {
                id: "proj_summary",
                sm: { x: 0, y: 4, width: 12, height: 4, locked: false },
                lg: { x: 0, y: 4, width: 8, height: 4, locked: false },
            },
            {
                id: "proj_status",
                sm: { x: 0, y: 8, width: 12, height: 3, locked: false },
                lg: { x: 8, y: 0, width: 4, height: 4, locked: false },
            },
            {
                id: "proj_metrics_grid",
                sm: { x: 0, y: 11, width: 12, height: 8, locked: false },
                lg: { x: 0, y: 8, width: 8, height: 8, locked: false },
            },
            {
                id: "proj_owner",
                sm: { x: 0, y: 19, width: 12, height: 4, locked: false },
                lg: { x: 8, y: 4, width: 4, height: 4, locked: false },
            },
            {
                id: "proj_action",
                sm: { x: 0, y: 33, width: 12, height: 3, locked: false },
                lg: { x: 8, y: 12, width: 4, height: 4, locked: false },
            },
        ],
    },
    components: {
        proj_header: {
            id: "proj_header",
            type: "TEXT",
            props: { text: "", variant: "title" },
            slots: {},
            bindings: [{ prop: "text", source: { type: "DataPath", path: "$.data/project/name" } }],
            fetchPolicy: "LAZY",
        },
        proj_summary: {
            id: "proj_summary",
            type: "TEXT",
            slots: {},
            props: { text: "", variant: "body" },
            bindings: [
                { prop: "text", source: { type: "DataPath", path: "$.data/summary/description" } },
            ],
            fetchPolicy: "LAZY",
            visible: {
                op: "EXISTS",
                left: { kind: "Path", path: "$.data/summary/description" },
            },
        },
        proj_status: {
            id: "proj_status",
            type: "TEXT",
            props: { text: "", variant: "muted" },
            slots: {},
            bindings: [
                { prop: "text", source: { type: "DataPath", path: "$.data/project/status" } },
            ],
            visible: { op: "EXISTS", left: { kind: "Path", path: "$.data/project/status" } },
            fetchPolicy: "LAZY",
        },
        proj_metrics_grid: {
            id: "proj_metrics_grid",
            type: "LAYOUT_CONTAINER",
            props: { title: "Key metrics", description: "Progress snapshot" },
            slots: {
                main: [
                    "proj_metric_progress",
                    "proj_metric_budget",
                    "proj_metric_risks",
                    "proj_tasks",
                ],
            },
            slotLayout: {
                main: {
                    cols: 12,
                    rowHeight: 40,
                    margin: 8,
                    items: [
                        {
                            id: "proj_metric_progress",
                            sm: { x: 0, y: 0, width: 12, height: 4, locked: false },
                            lg: { x: 0, y: 0, width: 6, height: 4, locked: false },
                        },
                        {
                            id: "proj_metric_budget",
                            sm: { x: 0, y: 4, width: 12, height: 4, locked: false },
                            lg: { x: 6, y: 0, width: 6, height: 4, locked: false },
                        },
                        {
                            id: "proj_metric_risks",
                            sm: { x: 0, y: 8, width: 12, height: 4, locked: false },
                            lg: { x: 0, y: 4, width: 12, height: 4, locked: false },
                        },
                        {
                            id: "proj_tasks",
                            sm: { x: 0, y: 12, width: 12, height: 10, locked: false },
                            lg: { x: 0, y: 8, width: 12, height: 10, locked: false },
                        },
                    ],
                },
            },
            bindings: [],
            fetchPolicy: "LAZY",
        },
        proj_metric_progress: {
            id: "proj_metric_progress",
            type: "TEXT",
            props: { text: "", variant: "subtitle" },
            slots: {},
            bindings: [
                {
                    prop: "text",
                    source: { type: "DataPath", path: "$.data/project/metricsDisplay/progress" },
                },
            ],
            fetchPolicy: "LAZY",
        },
        proj_metric_budget: {
            id: "proj_metric_budget",
            type: "TEXT",
            props: { text: "", variant: "subtitle" },
            slots: {},
            bindings: [
                {
                    prop: "text",
                    source: { type: "DataPath", path: "$.data/project/metricsDisplay/budget" },
                },
            ],
            fetchPolicy: "LAZY",
        },
        proj_metric_risks: {
            id: "proj_metric_risks",
            type: "TEXT",
            props: { text: "", variant: "subtitle" },
            slots: {},
            bindings: [
                {
                    prop: "text",
                    source: { type: "DataPath", path: "$.data/project/metricsDisplay/risks" },
                },
            ],
            fetchPolicy: "LAZY",
        },
        proj_owner: {
            id: "proj_owner",
            type: "TABLE",
            slots: {},
            props: { title: "Project owner", description: "Primary contact" },
            bindings: [
                {
                    prop: "data",
                    source: {
                        type: "RefSlot",
                        slot: "owner",
                        presentation: "SUMMARY",
                        fields: ["name", "domain"],
                    },
                },
            ],
            fetchPolicy: "LAZY",
        },
        proj_tasks: {
            id: "proj_tasks",
            type: "LINE_ITEM",
            slots: {},
            props: { title: "Tasks", itemComponent: "PROJECT_TASK", emptyMessage: "No tasks yet" },
            bindings: [
                {
                    prop: "items",
                    source: {
                        type: "RefSlot",
                        slot: "tasks",
                        presentation: "INLINE",
                        expandDepth: 1,
                    },
                },
            ],
            fetchPolicy: "LAZY",
        },
        proj_action: {
            slots: {},
            id: "proj_action",
            type: "BUTTON",
            props: {
                className: "px-4 py-2 bg-primary text-primary-foreground",
                variant: "default",
                size: "lg",
            },
            bindings: [
                { prop: "label", source: { type: "DataPath", path: "$.data/primaryAction/label" } },
            ],
            fetchPolicy: "LAZY",
            visible: {
                op: "EXISTS",
                left: { kind: "Path", path: "$.data/primaryAction/label" },
            },
        },
    },
};

export const invoiceDisplay: BlockRenderStructure = {
    version: 1,
    layoutGrid: {
        cols: 12,
        rowHeight: 40,
        width: 1200,
        height: 1000,
        items: [
            {
                id: "invoice_header",
                sm: { x: 0, y: 0, width: 12, height: 4, locked: false },
                lg: { x: 0, y: 0, width: 6, height: 4, locked: false },
            },
            {
                id: "invoice_amount",
                sm: { x: 0, y: 4, width: 12, height: 4, locked: false },
                lg: { x: 6, y: 0, width: 6, height: 4, locked: false },
            },
            {
                id: "invoice_client",
                sm: { x: 0, y: 8, width: 12, height: 6, locked: false },
                lg: { x: 0, y: 4, width: 6, height: 6, locked: false },
            },
            {
                id: "invoice_items",
                sm: { x: 0, y: 14, width: 12, height: 10, locked: false },
                lg: { x: 0, y: 10, width: 12, height: 10, locked: false },
            },
            {
                id: "invoice_action",
                sm: { x: 0, y: 24, width: 12, height: 3, locked: false },
                lg: { x: 6, y: 4, width: 6, height: 3, locked: false },
            },
            {
                id: "invoice_notes",
                sm: { x: 0, y: 27, width: 12, height: 4, locked: false },
                lg: { x: 6, y: 7, width: 6, height: 4, locked: false },
            },
        ],
    },
    components: {
        invoice_header: {
            id: "invoice_header",
            type: "TEXT",
            slots: {},
            props: { text: "", variant: "title" },
            bindings: [
                { prop: "text", source: { type: "DataPath", path: "$.data/invoice/number" } },
            ],
            fetchPolicy: "LAZY",
        },
        invoice_amount: {
            id: "invoice_amount",
            type: "TABLE",
            slots: {},
            props: { title: "Totals", description: "Breakdown of invoice totals" },
            bindings: [{ prop: "data", source: { type: "DataPath", path: "$.data/totals" } }],
            fetchPolicy: "LAZY",
        },
        invoice_client: {
            id: "invoice_client",
            type: "TABLE",
            slots: {},
            props: { title: "Client", description: "Billed organisation" },
            bindings: [
                {
                    prop: "data",
                    source: {
                        type: "RefSlot",
                        slot: "client",
                        presentation: "SUMMARY",
                        fields: ["name", "domain"],
                    },
                },
            ],
            fetchPolicy: "LAZY",
        },
        invoice_items: {
            id: "invoice_items",
            type: "LINE_ITEM",
            slots: {},
            props: { title: "Line items", itemComponent: "INVOICE_LINE_ITEM" },
            bindings: [
                {
                    prop: "items",
                    source: {
                        type: "RefSlot",
                        slot: "lineItems",
                        presentation: "INLINE",
                        expandDepth: 1,
                    },
                },
                {
                    prop: "currency",
                    source: { type: "DataPath", path: "$.data/totals/currency" },
                },
            ],
            fetchPolicy: "LAZY",
        },
        invoice_action: {
            id: "invoice_action",
            type: "BUTTON",
            slots: {},
            props: {
                className: "px-4 py-2 bg-primary text-primary-foreground",
                variant: "default",
                size: "lg",
            },
            bindings: [
                { prop: "label", source: { type: "DataPath", path: "$.data/payAction/label" } },
            ],
            fetchPolicy: "LAZY",
            visible: { op: "EXISTS", left: { kind: "Path", path: "$.data/payAction/label" } },
        },
        invoice_notes: {
            id: "invoice_notes",
            type: "TEXT",
            slots: {},
            props: { text: "", variant: "muted" },
            bindings: [
                { prop: "text", source: { type: "DataPath", path: "$.data/invoice/notes" } },
            ],
            fetchPolicy: "LAZY",
            visible: { op: "EXISTS", left: { kind: "Path", path: "$.data/invoice/notes" } },
        },
    },
};

export const display = contactDisplay;
