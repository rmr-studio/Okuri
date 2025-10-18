"use client";

import {
    BlockComponentNode,
    BlockRenderStructure,
    BlockTree,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { TypeIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import {
    BlockInsertHandle,
    BlockSurface,
    defaultSlashItems,
    QuickActionItem,
    SlashMenuItem,
} from "../BlockSurface";
import { RenderBlock } from "../render";

type PlaygroundBlock = {
    id: string;
    title: string;
    description?: string;
    badge?: string;
    tree: BlockTree;
    display: BlockRenderStructure;
};

type SurfaceInsertHandler = (item: SlashMenuItem, position: number) => void;

const uniqueId = (prefix: string) =>
    `${prefix}-${
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }`;

const BASE_GRID = { cols: 12, rowHeight: 40, margin: 8 };

const createContactBlock = (): PlaygroundBlock => {
    const contactId = uniqueId("contact");
    const blockId = uniqueId("block");
    const addresses = [
        {
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

    const tree: BlockTree = {
        root: {
            block: {
                id: blockId,
                type: { key: "contact", version: 3 },
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
                        links: {
                            profile: "/clients/client-1111",
                        },
                        avatarUrl: "https://avatar.vercel.sh/jane",
                    },
                    refs: [],
                    meta: { validationErrors: [] },
                },
            },
            references: {
                account: [
                    {
                        entityType: "CLIENT",
                        entityId: "aaaa-bbbb-cccc",
                        ownership: "LINKED",
                        path: "$.data/client/company",
                        entity: { name: "Acme Pty Ltd", domain: "acme.com" },
                    },
                ],
                addresses,
            },
        },
    };

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

    return {
        id: uniqueId("surface"),
        title: "Contact overview",
        description: "Primary client information and inline addresses.",
        badge: "Default template",
        tree,
        display,
    };
};

const createProjectMetricsBlock = (): PlaygroundBlock => {
    const blockId = uniqueId("project");
    const taskRefs = Array.from({ length: 3 }).map((_, index) => ({
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

    const tree: BlockTree = {
        root: {
            block: {
                id: blockId,
                type: { key: "project", version: 1 },
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
            },
            references: {
                tasks: taskRefs,
            },
        },
    };

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
        id: uniqueId("surface"),
        title: "Project health",
        description: "Live status and owned tasks for the current project.",
        badge: "Nested layout",
        tree,
        display,
    };
};

const createInvoiceSummaryBlock = (): PlaygroundBlock => {
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

    const tree: BlockTree = {
        root: {
            block: {
                id: uniqueId("block"),
                type: { key: "invoice_summary", version: 1 },
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
            },
            references: {},
        },
    };

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

    return {
        id: uniqueId("surface"),
        title: "Billing overview",
        description: "Snapshot of recent invoices with quick access to creation.",
        badge: "Finance",
        tree,
        display,
    };
};

const createBlankNoteBlock = (): PlaygroundBlock => {
    const tree: BlockTree = {
        root: {
            block: {
                id: uniqueId("block"),
                type: { key: "note", version: 1 },
                payload: {
                    data: { content: "Start typing..." },
                    refs: [],
                    meta: { validationErrors: [] },
                },
            },
            references: {},
        },
    };

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
        id: uniqueId("surface"),
        title: "Untitled note",
        description: "A lightweight freeform note.",
        badge: "Draft",
        tree,
        display,
    };
};

const createPlaceholderBlock = (type: string, label?: string): PlaygroundBlock => {
    const text = label ?? `New ${type.toLowerCase()}`;
    const tree: BlockTree = {
        root: {
            block: {
                id: uniqueId("block"),
                type: { key: "placeholder", version: 1 },
                payload: {
                    data: { content: text },
                    refs: [],
                    meta: { validationErrors: [] },
                },
            },
            references: {},
        },
    };

    const components: Record<string, BlockComponentNode> = {
        placeholder: {
            id: "placeholder",
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
                    id: "placeholder",
                    lg: { x: 0, y: 0, width: 12, height: 4, locked: false },
                    sm: { x: 0, y: 0, width: 12, height: 4, locked: false },
                },
            ],
        },
        components,
    };

    return {
        id: uniqueId("surface"),
        title: label ?? type,
        description: "Placeholder block. Replace with real data.",
        badge: "New",
        tree,
        display,
    };
};

const createBlockFromSlashItem = (item: SlashMenuItem): PlaygroundBlock | null => {
    switch (item.id) {
        case "CONTACT_CARD":
            return createContactBlock();
        case "LAYOUT_CONTAINER":
            return createProjectMetricsBlock();
        case "LINE_ITEM":
            return createProjectMetricsBlock();
        case "TABLE":
        case "BUTTON":
            return createInvoiceSummaryBlock();
        case "TEXT":
            return createBlankNoteBlock();
        case "BLANK_NOTE":
            return createBlankNoteBlock();
        default:
            return createPlaceholderBlock(item.id, item.label);
    }
};

const playgroundSlashItems: SlashMenuItem[] = [
    ...defaultSlashItems,
    {
        id: "BLANK_NOTE",
        label: "Blank note",
        description: "Start with an unstructured text block",
        icon: <TypeIcon className="size-4" />,
    },
];

const initialBlocks: PlaygroundBlock[] = [
    createContactBlock(),
    createProjectMetricsBlock(),
    createInvoiceSummaryBlock(),
];

export const BlockDemo = () => {
    const [blocks, setBlocks] = useState<PlaygroundBlock[]>(initialBlocks);

    const insertBlock = useCallback((item: SlashMenuItem, position: number) => {
        const newBlock = createBlockFromSlashItem(item);
        if (!newBlock) return;
        setBlocks((prev) => {
            const next = [...prev];
            next.splice(position, 0, newBlock);
            return next;
        });
    }, []);

    const removeBlock = useCallback((id: string) => {
        setBlocks((prev) => prev.filter((block) => block.id !== id));
    }, []);

    const duplicateBlock = useCallback((block: PlaygroundBlock, position: number) => {
        const cloned: PlaygroundBlock = {
            ...createPlaceholderBlock(block.title ?? "Clone"),
            title: `${block.title} (copy)`,
            description: block.description,
            badge: block.badge,
            tree: JSON.parse(JSON.stringify(block.tree)),
            display: JSON.parse(JSON.stringify(block.display)),
        };
        setBlocks((prev) => {
            const next = [...prev];
            next.splice(position, 0, cloned);
            return next;
        });
    }, []);

    const handleInsert: SurfaceInsertHandler = useCallback(
        (item, position) => insertBlock(item, position),
        [insertBlock]
    );

    const quickActionsFor = useCallback(
        (block: PlaygroundBlock, index: number): QuickActionItem[] => [
            {
                id: "duplicate",
                label: "Duplicate block",
                shortcut: "⌘D",
                onSelect: () => duplicateBlock(block, index + 1),
            },
            {
                id: "delete",
                label: "Delete block",
                shortcut: "⌘⌫",
                onSelect: () => removeBlock(block.id),
            },
        ],
        [duplicateBlock, removeBlock]
    );

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-12 p-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold">Block Playground</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    Prototype interactive block layouts, forms, and bindings before wiring them into
                    real entities. Use the slash menu or hover handles to insert new blocks, and
                    test nested structures, owned references, and linked summaries.
                </p>
            </header>

            {blocks.map((block, index) => (
                <React.Fragment key={block.id}>
                    <BlockSurface
                        id={block.id}
                        title={block.title}
                        description={block.description}
                        badge={block.badge}
                        slashItems={playgroundSlashItems}
                        quickActions={quickActionsFor(block, index)}
                        onInsert={(item) => handleInsert(item, index + 1)}
                    >
                        <RenderBlock tree={block.tree} display={block.display} />
                    </BlockSurface>
                    {index < blocks.length - 1 ? (
                        <BlockInsertHandle
                            label="Insert block"
                            slashItems={playgroundSlashItems}
                            onInsert={(item) => handleInsert(item, index + 1)}
                        />
                    ) : null}
                </React.Fragment>
            ))}

            <BlockInsertHandle
                label="Add block"
                slashItems={playgroundSlashItems}
                onInsert={(item) => handleInsert(item, blocks.length)}
            />
        </div>
    );
};
