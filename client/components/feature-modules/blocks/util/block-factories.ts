/**
 * Block Factory Functions
 *
 * These functions create BlockTree instances for demo/testing purposes.
 * They generate blocks with mock data and proper structure.
 */

import {
    BlockComponentNode,
    BlockNode,
    BlockReference,
    BlockRenderStructure,
    BlockTree,
    BlockType,
} from "../interface/block.interface";

const uniqueId = (prefix: string) =>
    `${prefix}-${
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }`;

const BASE_GRID = { cols: 12, rowHeight: 60, margin: 12 };

const ALL_BLOCK_COMPONENT_TYPES: BlockType["nesting"]["allowedTypes"] = [
    "CONTACT_CARD",
    "LAYOUT_CONTAINER",
    "ADDRESS_CARD",
    "LINE_ITEM",
    "TABLE",
    "TEXT",
    "IMAGE",
    "BUTTON",
    "ATTACHMENT",
];

/**
 * Creates a contact block with client information and addresses
 */

export function createContactBlockTree(organisationId: string): BlockTree {
    const contactEntityId = uniqueId("client"); // This is the CLIENT entity id (not a block id)
    const rootBlockId = uniqueId("block");

    // --- OWNED child blocks: two addresses ----------------------------------------------------

    const address1Id = uniqueId("addr");
    const address2Id = uniqueId("addr");

    const address1Node: BlockNode = {
        block: {
            id: address1Id,
            name: "Primary Address",
            organisationId,
            type: {
                id: uniqueId("type"),
                key: "address",
                version: 1,
                name: "Address",
                description: "Physical address location",
                archived: false,
                strictness: "SOFT",
                system: false,
                schema: { name: "Address", type: "OBJECT", required: true, properties: {} },
                display: {
                    form: { fields: {} },
                    render: {
                        version: 1,
                        layoutGrid: { ...BASE_GRID, items: [] },
                        components: {},
                    },
                },
            },
            payload: {
                data: {
                    street: "1 Collins St",
                    city: "Melbourne",
                    state: "VIC",
                    postalCode: "3000",
                    country: "AU",
                },
                refs: [],
                meta: { validationErrors: [] },
            },
            archived: false,
        },
        children: {},
        references: {},
        warnings: [],
    };

    const address2Node: BlockNode = {
        block: {
            id: address2Id,
            name: "Secondary Address",
            organisationId,
            type: {
                id: uniqueId("type"),
                key: "address",
                version: 1,
                name: "Address",
                description: "Physical address location",
                archived: false,
                strictness: "SOFT",
                system: false,
                schema: { name: "Address", type: "OBJECT", required: true, properties: {} },
                display: {
                    form: { fields: {} },
                    render: {
                        version: 1,
                        layoutGrid: { ...BASE_GRID, items: [] },
                        components: {},
                    },
                },
            },
            payload: {
                data: {
                    street: "2 George St",
                    city: "Sydney",
                    state: "NSW",
                    postalCode: "2000",
                    country: "AU",
                },
                refs: [],
                meta: { validationErrors: [] },
            },
            archived: false,
        },
        children: {},
        references: {},
        warnings: [],
    };

    // Optional flat ref index rows (good for server parity / diagnostics)
    const flatRefIndex: BlockReference[] = [
        // LINKED client ref at $.data/client
        {
            id: uniqueId("ref"),
            entityType: "CLIENT",
            entityId: contactEntityId,
            ownership: "LINKED",
            path: "$.data/client",
        },
        // OWNED address refs at $.data/addresses[0..1] (ordering preserved)
        {
            id: uniqueId("ref"),
            entityType: "BLOCK",
            entityId: address1Id,
            ownership: "OWNED",
            path: "$.data/addresses[0]",
            orderIndex: 0,
        },
        {
            id: uniqueId("ref"),
            entityType: "BLOCK",
            entityId: address2Id,
            ownership: "OWNED",
            path: "$.data/addresses[1]",
            orderIndex: 1,
        },
    ];

    // --- Display/components for the ROOT block ------------------------------------------------

    const components: Record<string, BlockComponentNode> = {
        contactCard: {
            id: "contactCard",
            type: "CONTACT_CARD",
            props: { avatarShape: "circle" },
            bindings: [
                // IMPORTANT: bind the CLIENT via the linked ref slot "client"
                {
                    prop: "client",
                    source: {
                        type: "RefSlot",
                        slot: "client",
                        presentation: "SUMMARY", // or "ENTITY" if you ship full entity object
                        fields: ["name", "type"], // which fields to project from summary/entity
                    },
                },
                { prop: "href", source: { type: "DataPath", path: "$.data/links/profile" } },
                { prop: "avatarUrl", source: { type: "DataPath", path: "$.data/avatarUrl" } },
            ],
            slots: {},
            fetchPolicy: "LAZY",
        },

        contactAddresses: {
            id: "contactAddresses",
            type: "LINE_ITEM",
            props: {
                title: "Addresses",
                itemComponent: "ADDRESS_CARD",
                emptyMessage: "Add address",
            },
            bindings: [
                {
                    prop: "items",
                    source: {
                        type: "RefSlot",
                        slot: "addresses", // OWNED child slot
                        presentation: "INLINE", // embedded children
                        expandDepth: 1,
                    },
                },
            ],
            slots: {},
            fetchPolicy: "LAZY",
        },
    };

    const display: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            ...BASE_GRID,
            items: [
                {
                    id: "contactCard",
                    sm: { x: 0, y: 0, width: 12, height: 8, locked: false },
                    lg: { x: 0, y: 0, width: 6, height: 8, locked: false },
                },
                {
                    id: "contactAddresses",
                    sm: { x: 0, y: 8, width: 12, height: 8, locked: false },
                    lg: { x: 6, y: 0, width: 6, height: 8, locked: false },
                },
            ],
        },
        components,
    };

    // --- ROOT node ---------------------------------------------------------------------------

    return {
        maxDepth: 10,
        expandRefs: true,
        root: {
            block: {
                id: rootBlockId,
                name: "Contact Overview",
                organisationId,
                type: {
                    id: uniqueId("type"),
                    key: "contact",
                    version: 3,
                    name: "Contact Overview",
                    description: "Primary client information and inline addresses",
                    archived: false,
                    strictness: "SOFT",
                    system: false,
                    schema: {
                        name: "Contact",
                        type: "OBJECT",
                        required: true,
                        properties: {},
                    },
                    display: {
                        form: { fields: {} },
                        render: display,
                    },
                },
                payload: {
                    data: {
                        // LINKED reference marker to a CLIENT entity
                        client: {
                            _refType: "CLIENT",
                            _refId: contactEntityId,
                            _ownership: "LINKED",
                        },
                        links: { profile: "/clients/client-1111" },
                        avatarUrl: "https://avatar.vercel.sh/jane",
                        // NOTE: do NOT inline the full client object here; keep it as a ref marker.
                    },
                    refs: flatRefIndex, // optional flat index
                    meta: { validationErrors: [] },
                },
                archived: false,
            },

            // OWNED children live here:
            children: {
                addresses: [address1Node, address2Node],
            },

            // LINKED references live here (grouped by slot key):
            references: {
                client: [
                    {
                        id: uniqueId("ref"),
                        entityType: "CLIENT",
                        entityId: contactEntityId,
                        ownership: "LINKED",
                        path: "$.data/client",
                        // Optional summary snapshot used by the summary chip/card
                        entity: { id: contactEntityId, name: "Jane Doe", type: "CUSTOMER" },
                    },
                ],
                // IMPORTANT: do NOT put addresses here because they are OWNED children
            },

            warnings: [],
        },
    };
}

/**
 * Creates a project block with metrics and tasks
 */
export function createProjectBlockTree(organisationId: string): BlockTree {
    const blockId = uniqueId("project");

    // Create actual task BlockNodes
    const taskData = [
        { title: "Wireframes", assignee: "Jane Doe", status: "IN_REVIEW", dueDate: "2024-07-12" },
        {
            title: "Analytics events",
            assignee: "Kai Wong",
            status: "IN_PROGRESS",
            dueDate: "2024-07-19",
        },
        {
            title: "Rollout comms",
            assignee: "Tina Patel",
            status: "NOT_STARTED",
            dueDate: "2024-07-26",
        },
    ];

    const taskNodes = taskData.map((task, index) => {
        const taskId = uniqueId("task");
        return {
            block: {
                id: taskId,
                name: task.title,
                organisationId,
                type: {
                    id: uniqueId("type"),
                    key: "task",
                    version: 1,
                    name: "Task",
                    description: "Project task item",
                    nesting: null,
                    archived: false,
                    strictness: "SOFT",
                    system: false,
                    schema: { name: "Task", type: "OBJECT", required: true, properties: {} },
                    display: {
                        form: { fields: {} },
                        render: {
                            version: 1,
                            layoutGrid: { ...BASE_GRID, items: [] },
                            components: {},
                        },
                    },
                },
                payload: {
                    data: task,
                    refs: [],
                    meta: { validationErrors: [] },
                },
                archived: false,
            },
            children: {},
            references: {},
            warnings: [],
        };
    });

    // Create references array that points to the task blocks
    const taskRefs = taskNodes.map((taskNode, index) => ({
        id: uniqueId("ref"),
        entityType: "BLOCK" as const,
        entityId: taskNode.block.id,
        ownership: "OWNED" as const,
        path: `$.data/tasks[${index}]`,
        orderIndex: index,
    }));

    const components: Record<string, BlockComponentNode> = {
        metricsContainer: {
            id: "metricsContainer",
            type: "LAYOUT_CONTAINER",
            props: { title: "Key metrics", description: "Team health snapshot" },
            bindings: [],
            slots: {
                main: ["metricProgress", "metricBudget", "metricRisk", "taskList"],
            },
            slotLayout: {
                main: {
                    grid: BASE_GRID,
                    items: [
                        {
                            id: "metricProgress",
                            lg: { x: 0, y: 0, width: 6, height: 4, locked: false },
                            sm: { x: 0, y: 0, width: 12, height: 4, locked: false },
                        },
                        {
                            id: "metricBudget",
                            lg: { x: 6, y: 0, width: 6, height: 4, locked: false },
                            sm: { x: 0, y: 4, width: 12, height: 4, locked: false },
                        },
                        {
                            id: "metricRisk",
                            lg: { x: 0, y: 4, width: 12, height: 4, locked: false },
                            sm: { x: 0, y: 8, width: 12, height: 4, locked: false },
                        },
                        {
                            id: "taskList",
                            lg: { x: 0, y: 8, width: 12, height: 10, locked: false },
                            sm: { x: 0, y: 12, width: 12, height: 10, locked: false },
                        },
                    ],
                },
            },
            fetchPolicy: "LAZY",
        },
        metricProgress: {
            id: "metricProgress",
            type: "TEXT",
            props: { variant: "subtitle" },
            bindings: [
                {
                    prop: "text",
                    source: { type: "DataPath", path: "$.data/project/metricsDisplay/progress" },
                },
            ],
            slots: {},
            fetchPolicy: "LAZY",
        },
        metricBudget: {
            id: "metricBudget",
            type: "TEXT",
            props: { variant: "subtitle" },
            bindings: [
                {
                    prop: "text",
                    source: { type: "DataPath", path: "$.data/project/metricsDisplay/budget" },
                },
            ],
            slots: {},
            fetchPolicy: "LAZY",
        },
        metricRisk: {
            id: "metricRisk",
            type: "TEXT",
            props: { variant: "subtitle" },
            bindings: [
                {
                    prop: "text",
                    source: { type: "DataPath", path: "$.data/project/metricsDisplay/risks" },
                },
            ],
            slots: {},
            fetchPolicy: "LAZY",
        },
        taskList: {
            id: "taskList",
            type: "LINE_ITEM",
            props: { title: "Active tasks", itemComponent: "PROJECT_TASK" },
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
            slots: {},
            fetchPolicy: "LAZY",
        },
    };

    const display: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            ...BASE_GRID,
            items: [
                {
                    id: "metricsContainer",
                    lg: { x: 0, y: 0, width: 12, height: 18, locked: false },
                    sm: { x: 0, y: 0, width: 12, height: 18, locked: false },
                },
            ],
        },
        components,
    };

    return {
        maxDepth: 10,
        expandRefs: true,
        root: {
            block: {
                id: blockId,
                name: "Project Health",
                organisationId,
                type: {
                    id: uniqueId("type"),
                    key: "project",
                    version: 1,
                    name: "Project Health",
                    description: "Live status and owned tasks for the current project",
                    nesting: {
                        allowDuplicates: true,
                        allowedTypes: ALL_BLOCK_COMPONENT_TYPES,
                    },
                    archived: false,
                    strictness: "SOFT",
                    system: false,
                    schema: {
                        name: "Project",
                        type: "OBJECT",
                        required: true,
                        properties: {},
                    },
                    display: {
                        form: { fields: {} },
                        render: display,
                    },
                },
                payload: {
                    data: {
                        project: {
                            name: "Onboarding Portal Revamp",
                            status: "IN_PROGRESS",
                            metricsDisplay: {
                                progress: "Progress: 68%",
                                budget: "Budget used: 45%",
                                risks: "Open risks: 2",
                            },
                        },
                        summary: {
                            description:
                                "Reworking onboarding flows and portal UI for enterprise clients.",
                            dueDate: "2024-12-20",
                        },
                        primaryAction: { label: "Open project" },
                    },
                    refs: [],
                    meta: { validationErrors: [] },
                },
                archived: false,
            },
            children: {
                tasks: taskNodes,
            },
            references: {
                tasks: taskRefs,
            },
            warnings: [],
        },
    };
}

/**
 * Creates a simple note block
 */
export function createNoteBlockTree(organisationId: string, content?: string): BlockTree {
    const blockId = uniqueId("block");

    const components: Record<string, BlockComponentNode> = {
        noteText: {
            id: "noteText",
            type: "TEXT",
            props: { variant: "body" },
            bindings: [{ prop: "text", source: { type: "DataPath", path: "$.data/content" } }],
            slots: {},
            fetchPolicy: "LAZY",
        },
    };

    const display: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            ...BASE_GRID,
            items: [
                {
                    id: "noteText",
                    lg: { x: 0, y: 0, width: 12, height: 6, locked: false },
                    sm: { x: 0, y: 0, width: 12, height: 6, locked: false },
                },
            ],
        },
        components,
    };

    return {
        maxDepth: 10,
        expandRefs: false,
        root: {
            block: {
                id: blockId,
                name: "Note",
                organisationId,
                type: {
                    id: uniqueId("type"),
                    key: "note",
                    version: 1,
                    name: "Note",
                    description: "A simple text note",
                    archived: false,
                    strictness: "SOFT",
                    system: false,
                    schema: {
                        name: "Note",
                        type: "OBJECT",
                        required: true,
                        properties: {},
                    },
                    display: {
                        form: { fields: {} },
                        render: display,
                    },
                },
                payload: {
                    data: { content: content ?? "Start typing..." },
                    refs: [],
                    meta: { validationErrors: [] },
                },
                archived: false,
            },
            children: {},
            references: {},
            warnings: [],
        },
    };
}

/**
 * Creates a blank panel block (for nesting other blocks)
 */
export function createBlankPanelTree(organisationId: string): BlockTree {
    const blockId = uniqueId("panel");

    const display: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            ...BASE_GRID,
            items: [],
        },
        components: {},
    };

    return {
        maxDepth: 10,
        expandRefs: false,
        root: {
            block: {
                id: blockId,
                name: "Panel",
                organisationId,
                type: {
                    id: uniqueId("type"),
                    key: "panel",
                    version: 1,
                    name: "Panel",
                    description: "A container for organizing blocks",
                    nesting: {
                        allowDuplicates: true,
                        allowedTypes: ALL_BLOCK_COMPONENT_TYPES,
                    },
                    archived: false,
                    strictness: "SOFT",
                    system: false,
                    schema: {
                        name: "Panel",
                        type: "OBJECT",
                        required: true,
                        properties: {},
                    },
                    display: {
                        form: { fields: {} },
                        render: display,
                    },
                },
                payload: {
                    data: {},
                    refs: [],
                    meta: { validationErrors: [] },
                },
                archived: false,
            },
            children: {},
            references: {},
            warnings: [],
        },
    };
}
