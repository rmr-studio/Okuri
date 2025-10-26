/**
 * Block Factories
 *
 * Factory functions that create properly structured BlockTree instances
 * for use in the editor. These replace the old PlaygroundBlock mock data.
 */

import {
    BlockComponentNode,
    BlockReference,
    BlockRenderStructure,
    BlockTree,
    BlockType,
} from "../../interface/block.interface";
import { EditorBlockInstance, EditorLayoutRect } from "../../interface/editor.interface";
import { BlockTreeBuilder } from "../../util/block-tree.builder";

const BASE_GRID = {
    cols: 12,
    rowHeight: 40,
    width: 1200,
    margin: 8,
};

/**
 * Generate a unique ID
 */
function uniqueId(prefix: string): string {
    return BlockTreeBuilder.generateId(prefix);
}

/**
 * Create a contact block with client information
 */
export function createContactBlockTree(): BlockTree {
    const contactId = uniqueId("contact");
    const blockId = uniqueId("block");
    const addresses: BlockReference[] = [
        {
            id: uniqueId("addr"),
            entityType: "BLOCK",
            entityId: uniqueId("addr"),
            ownership: "OWNED",
            path: "$.data/addresses[0]",
            orderIndex: 0,
            entity: {
                payload: {
                    data: {
                        street: "1 Collins St",
                        city: "Melbourne",
                        state: "VIC",
                        postalCode: "3000",
                        country: "AU",
                    },
                },
            },
        },
        {
            id: uniqueId("addr"),
            entityType: "BLOCK",
            entityId: uniqueId("addr"),
            ownership: "OWNED",
            path: "$.data/addresses[1]",
            orderIndex: 1,
            entity: {
                payload: {
                    data: {
                        street: "2 George St",
                        city: "Sydney",
                        state: "NSW",
                        postalCode: "2000",
                        country: "AU",
                    },
                },
            },
        },
    ];

    const components: Record<string, BlockComponentNode> = {
        contactCard: {
            id: "contactCard",
            type: "CONTACT_CARD",
            props: { avatarShape: "circle" },
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
                        slot: "addresses",
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

    const blockType: BlockType = {
        id: uniqueId("type"),
        key: "contact",
        version: 3,
        name: "Contact Overview",
        strictness: "SOFT",
        system: false,
        archived: false,
        schema: {
            name: "ContactBlock",
            type: "OBJECT",
            required: false,
            properties: {},
        },
        display: {
            form: { fields: {} },
            render: display,
        },
    };

    return {
        maxDepth: 1,
        expandRefs: false,
        root: {
            block: {
                id: blockId,
                name: "Contact overview",
                organisationId: "org-demo",
                type: blockType,
                payload: {
                    data: {
                        client: {
                            id: contactId,
                            organisationId: "org-1111",
                            name: "Jane Doe",
                            archived: false,
                            type: "CUSTOMER",
                            contact: {
                                email: "jane@acme.com",
                                phone: "+61 400 000 000",
                                address: {
                                    street: "1 Collins St",
                                    city: "Melbourne",
                                    state: "VIC",
                                    postalCode: "3000",
                                    country: "AU",
                                },
                            },
                            company: {
                                id: "company-1111",
                                organisationId: "org-1111",
                                name: "Acme Pty Ltd",
                                archived: false,
                                website: "https://acme.com",
                            },
                        },
                        links: { profile: "/clients/client-1111" },
                        avatarUrl: "https://avatar.vercel.sh/jane",
                    },
                    refs: [],
                    meta: { validationErrors: [] },
                },
                archived: false,
            },
            children: {},
            references: {
                account: [
                    {
                        id: "aaaa-bbbb-cccc",
                        entityType: "CLIENT",
                        entityId: "aaaa-bbbb-cccc",
                        ownership: "LINKED",
                        path: "$.data/client/company",
                        entity: { name: "Acme Pty Ltd", domain: "acme.com" },
                    },
                ],
                addresses,
            },
            warnings: [],
        },
    };
}

/**
 * Create a project metrics block with nested layout
 */
export function createProjectMetricsBlockTree(): BlockTree {
    const blockId = uniqueId("project");
    const taskRefs = Array.from({ length: 3 }).map((_, index) => ({
        id: uniqueId("task"),
        entityType: "BLOCK",
        entityId: uniqueId("task"),
        ownership: "OWNED",
        path: `$.data/tasks[${index}]`,
        orderIndex: index,
        entity: {
            payload: {
                data: {
                    title: ["Wireframes", "Analytics events", "Rollout comms"][index],
                    assignee: ["Jane Doe", "Kai Wong", "Tina Patel"][index],
                    status: ["IN_REVIEW", "IN_PROGRESS", "NOT_STARTED"][index],
                    dueDate: ["2024-07-12", "2024-07-19", "2024-07-26"][index],
                },
            },
        },
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
                    cols: 12,
                    rowHeight: 40,
                    margin: 8,
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

    const blockType: BlockType = {
        id: uniqueId("type"),
        key: "project",
        version: 1,
        name: "Project Health",
        nesting: {
            max: 10,
            allowDuplicates: true,
            allowedTypes: ["TEXT", "TABLE", "LAYOUT_CONTAINER"],
        },
        strictness: "SOFT",
        system: false,
        archived: false,
        schema: {
            name: "ProjectBlock",
            type: "OBJECT",
            required: false,
            properties: {},
        },
        display: {
            form: { fields: {} },
            render: display,
        },
    };

    return {
        maxDepth: 1,
        expandRefs: false,
        root: {
            block: {
                id: blockId,
                name: "Project health",
                organisationId: "org-demo",
                type: blockType,
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
            children: {},
            references: {
                tasks: taskRefs,
            },
            warnings: [],
        },
    };
}

/**
 * Create an invoice summary block
 */
export function createInvoiceSummaryBlockTree(): BlockTree {
    const invoices = [
        {
            number: "INV-2024-0005",
            status: "OVERDUE",
            issued: "2024-06-01",
            due: "2024-06-21",
            total: 12850,
        },
        {
            number: "INV-2024-0004",
            status: "PAID",
            issued: "2024-05-01",
            due: "2024-05-21",
            total: 8900,
        },
        {
            number: "INV-2024-0003",
            status: "PAID",
            issued: "2024-04-01",
            due: "2024-04-21",
            total: 10450,
        },
    ];

    const components: Record<string, BlockComponentNode> = {
        summaryTable: {
            id: "summaryTable",
            type: "TABLE",
            props: { title: "Recent invoices" },
            bindings: [{ prop: "data", source: { type: "DataPath", path: "$.data/invoices" } }],
            slots: {},
            fetchPolicy: "LAZY",
        },
        payButton: {
            id: "payButton",
            type: "BUTTON",
            props: {
                label: "Create invoice",
                className: "px-4 py-2 bg-primary text-primary-foreground",
            },
            bindings: [],
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
                    id: "summaryTable",
                    lg: { x: 0, y: 0, width: 12, height: 12, locked: false },
                    sm: { x: 0, y: 0, width: 12, height: 12, locked: false },
                },
                {
                    id: "payButton",
                    lg: { x: 0, y: 12, width: 3, height: 4, locked: false },
                    sm: { x: 0, y: 12, width: 12, height: 4, locked: false },
                },
            ],
        },
        components,
    };

    const blockType: BlockType = {
        id: uniqueId("type"),
        key: "invoice_summary",
        version: 1,
        name: "Billing Overview",
        strictness: "SOFT",
        system: false,
        archived: false,
        schema: {
            name: "InvoiceBlock",
            type: "OBJECT",
            required: false,
            properties: {},
        },
        display: {
            form: { fields: {} },
            render: display,
        },
    };

    return {
        maxDepth: 0,
        expandRefs: false,
        root: {
            block: {
                id: uniqueId("block"),
                name: "Billing overview",
                organisationId: "org-demo",
                type: blockType,
                payload: {
                    data: {
                        invoices,
                        stats: {
                            outstanding: 1,
                            overdueAmount: 12850,
                        },
                    },
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
 * Create a simple note block
 */
export function createNoteBlockTree(content: string = "Start typing..."): BlockTree {
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

    const blockType: BlockType = {
        id: uniqueId("type"),
        key: "note",
        version: 1,
        name: "Note",
        nesting: {
            max: 5,
            allowDuplicates: true,
            allowedTypes: ["TEXT", "IMAGE", "BUTTON"],
        },
        strictness: "SOFT",
        system: false,
        archived: false,
        schema: {
            name: "NoteBlock",
            type: "OBJECT",
            required: false,
            properties: {},
        },
        display: {
            form: { fields: {} },
            render: display,
        },
    };

    return {
        maxDepth: 0,
        expandRefs: false,
        root: {
            block: {
                id: uniqueId("block"),
                name: "Untitled note",
                organisationId: "org-demo",
                type: blockType,
                payload: {
                    data: { content },
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
 * Create initial demo environment with sample blocks
 */
export function createInitialDemoBlocks(): EditorBlockInstance[] {
    return [
        {
            tree: createContactBlockTree(),
            layout: { x: 0, y: 0, w: 6, h: 8 },
            uiMetadata: {
                customBadge: "Default template",
            },
        },
        {
            tree: createProjectMetricsBlockTree(),
            layout: { x: 6, y: 0, w: 6, h: 10 },
            uiMetadata: {
                customBadge: "Nested layout",
            },
        },
        {
            tree: createInvoiceSummaryBlockTree(),
            layout: { x: 0, y: 10, w: 12, h: 12 },
            uiMetadata: {
                customBadge: "Finance",
            },
        },
    ];
}
