"use client";

import {
    BlockComponentNode,
    BlockReference,
    BlockRenderStructure,
    BlockTree,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { GridContainerProvider } from "@/components/feature-modules/grid/provider/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/grid/provider/grid-provider";
import { RenderElementProvider } from "@/components/feature-modules/render/provider/render-element-provider";
import { createRenderElement } from "@/components/feature-modules/render/util/render-element.registry";
import { Button } from "@/components/ui/button";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import type { GridStackOptions } from "gridstack";
import "gridstack/dist/gridstack.css";
import { PlusIcon, TypeIcon } from "lucide-react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { BlockSurface, defaultSlashItems, QuickActionItem, SlashMenuItem } from "../BlockSurface";
import { RenderBlock } from "../render";

type LayoutRect = { x: number; y: number; w: number; h: number };

type PlaygroundBlock = {
    id: string;
    title: string;
    description?: string;
    badge?: string;
    tree: BlockTree;
    display: BlockRenderStructure;
    layout: LayoutRect;
    children?: PlaygroundBlock[];
};

type LayoutUpdate = LayoutRect & { id: string };

interface PlaygroundContextValue {
    blocks: PlaygroundBlock[];
    slashItems: SlashMenuItem[];
    getBlock(panelId: string, parentPath?: string[]): PlaygroundBlock | undefined;
    quickActionsFor(panelId: string): QuickActionItem[];
    insertPanel(item: SlashMenuItem, position: number): void;
    insertNested(parentId: string, item: SlashMenuItem, position?: number): void;
    duplicatePanel(panelId: string): void;
    removePanel(panelId: string): void;
    applyLayouts(parentPath: string[] | null, updates: LayoutUpdate[]): void;
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

const BASE_GRID = { cols: 12, rowHeight: 60, margin: 12 };

const playgroundSlashItems: SlashMenuItem[] = [
    ...defaultSlashItems,
    {
        id: "BLANK_NOTE",
        label: "Blank note",
        description: "Start with an unstructured text block",
        icon: <TypeIcon className="size-4" />,
    },
];

const PanelWidgetSchema = z.object({
    panelId: z.string(),
    parentPath: z.array(z.string()).optional(),
});

const PanelWidget: React.FC<z.infer<typeof PanelWidgetSchema>> = ({ panelId, parentPath }) => {
    const playground = usePlayground();
    const block = playground.getBlock(panelId, parentPath);
    if (!block) return null;

    const children = block.children ?? [];
    const isTopLevel = !parentPath || parentPath.length === 0;

    return (
        <BlockSurface
            id={block.id}
            title={block.title}
            description={block.description}
            badge={block.badge}
            slashItems={playground.slashItems}
            quickActions={playground.quickActionsFor(block.id)}
            onInsert={(item) => playground.insertNested(block.id, item, children.length)}
            onInsertSibling={(item) => {
                if (!isTopLevel) return;
                const topLevelIndex = playground.blocks.findIndex((b) => b.id === block.id);
                const insertAt = topLevelIndex >= 0 ? topLevelIndex + 1 : playground.blocks.length;
                playground.insertPanel(item, insertAt);
            }}
            nested={
                children.length > 0 ? (
                    <div className="rounded-lg border border-dashed/60 bg-background/40 p-4">
                        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                            Nested blocks
                        </h3>
                        <PanelGridWorkspace parentPath={[...(parentPath ?? []), block.id]} />
                    </div>
                ) : null
            }
            nestedFooter={
                <div className="pt-3">
                    <InlineInsertHandle
                        label="Add nested block"
                        onSelect={(item) =>
                            playground.insertNested(block.id, item, children.length)
                        }
                    />
                </div>
            }
        >
            <RenderBlock tree={block.tree} display={block.display} />
        </BlockSurface>
    );
};

const panelRegistry = {
    BLOCK_PANEL: createRenderElement({
        type: "BLOCK_PANEL",
        name: "Block panel",
        description: "Editable block surface for the playground",
        category: "BLOCK",
        schema: PanelWidgetSchema,
        component: PanelWidget,
    }),
};

const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [blocks, setBlocks] = useState<PlaygroundBlock[]>(() => initialBlocks());

    const insertPanel = useCallback((item: SlashMenuItem, position: number) => {
        setBlocks((prev) => {
            const layout = nextLayout(prev, 12, 8);
            const newPanel = createBlockFromSlashItem(item, layout);
            if (!newPanel) return prev;
            const next = [...prev];
            const insertAt = Math.min(Math.max(position, 0), next.length);
            next.splice(insertAt, 0, newPanel);
            return next;
        });
    }, []);

    const insertNested = useCallback((parentId: string, item: SlashMenuItem, position?: number) => {
        setBlocks((prev) => {
            const parent = findBlockById(prev, parentId);
            if (!parent) return prev;
            const layout = nextLayout(parent.children ?? [], 6, 6);
            const newBlock = createBlockFromSlashItem(item, layout);
            if (!newBlock) return prev;
            return addChildBlock(prev, parentId, newBlock, position);
        });
    }, []);

    const duplicatePanel = useCallback((panelId: string) => {
        setBlocks((prev) => duplicateBlockById(prev, panelId));
    }, []);

    const removePanel = useCallback((panelId: string) => {
        setBlocks((prev) => removeBlockById(prev, panelId));
    }, []);

    const applyLayouts = useCallback((parentPath: string[] | null, updates: LayoutUpdate[]) => {
        setBlocks((prev) => updateLayouts(prev, parentPath, updates));
    }, []);

    const getBlock = useCallback(
        (panelId: string, parentPath: string[] = []) => {
            return findBlock(blocks, panelId, parentPath);
        },
        [blocks]
    );

    const quickActionsFor = useCallback(
        (panelId: string): QuickActionItem[] => [
            {
                id: "duplicate",
                label: "Duplicate block",
                shortcut: "⌘D",
                onSelect: () => duplicatePanel(panelId),
            },
            {
                id: "delete",
                label: "Delete block",
                shortcut: "⌘⌫",
                onSelect: () => removePanel(panelId),
            },
        ],
        [duplicatePanel, removePanel]
    );

    const value = useMemo<PlaygroundContextValue>(
        () => ({
            blocks,
            slashItems: playgroundSlashItems,
            getBlock,
            quickActionsFor,
            insertPanel,
            insertNested,
            duplicatePanel,
            removePanel,
            applyLayouts,
        }),
        [
            blocks,
            getBlock,
            quickActionsFor,
            insertPanel,
            insertNested,
            duplicatePanel,
            removePanel,
            applyLayouts,
        ]
    );

    return <PlaygroundContext.Provider value={value}>{children}</PlaygroundContext.Provider>;
};

export const BlockDemo = () => {
    return (
        <PlaygroundProvider>
            <div className="mx-auto max-w-6xl space-y-8 p-6">
                <header className="space-y-2">
                    <h1 className="text-2xl font-semibold">Block Playground</h1>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        Prototype block layout behaviour: drag, resize, and nest panels via
                        Gridstack. Use the slash menu inside a panel to add nested blocks; use the
                        divider handles to add new top-level panels.
                    </p>
                </header>

                <PanelGridWorkspace />

                <AddPanelHandle position="end" />
            </div>
        </PlaygroundProvider>
    );
};

/* -------------------------------------------------------------------------- */
/* Panel Rendering                                                            */
/* -------------------------------------------------------------------------- */

export const PanelGridWorkspace: React.FC<{ parentPath?: string[] }> = ({ parentPath }) => {
    const playground = usePlayground();
    const panels = useMemo(
        () => (parentPath ? findChildren(playground.blocks, parentPath) : playground.blocks),
        [playground.blocks, parentPath]
    );

    const gridOptions = useMemo(
        () => buildPanelGridOptions(panels, parentPath),
        [panels, parentPath]
    );

    return (
        <GridProvider initialOptions={gridOptions}>
            <PanelLayoutSync parentPath={parentPath ?? null} />
            <GridContainerProvider>
                <RenderElementProvider registry={panelRegistry} />
            </GridContainerProvider>
        </GridProvider>
    );
};

const PanelLayoutSync: React.FC<{ parentPath: string[] | null }> = ({ parentPath }) => {
    const playground = usePlayground();
    const { gridStack } = useGrid();

    useEffect(() => {
        if (!gridStack) return;

        const handler = () => {
            const nodes = gridStack.engine.nodes ?? [];
            const updates: LayoutUpdate[] = nodes.map((node) => ({
                id: String(node.id),
                x: node.x ?? 0,
                y: node.y ?? 0,
                w: node.w ?? 1,
                h: node.h ?? 1,
            }));
            playground.applyLayouts(parentPath, updates);
        };

        gridStack.on("change", handler);
        gridStack.on("dragstop", handler);
        gridStack.on("resizestop", handler);

        return () => {
            gridStack.off("change");
            gridStack.off("dragstop");
            gridStack.off("resizestop");
        };
    }, [gridStack, playground, parentPath]);

    return null;
};

/* -------------------------------------------------------------------------- */
/* Handles & Menus                                                            */
/* -------------------------------------------------------------------------- */

const InlineInsertHandle: React.FC<{
    label: string;
    onSelect: (item: SlashMenuItem) => void;
}> = ({ label, onSelect }) => {
    const [open, setOpen] = useState(false);
    const playground = usePlayground();
    const items = playground.slashItems;

    return (
        <>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
                <PlusIcon className="size-4" />
                {label}
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Insert block…" />
                <CommandList>
                    <CommandEmpty>No matches found.</CommandEmpty>
                    <CommandGroup heading="Blocks">
                        {items.map((item) => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => {
                                    setOpen(false);
                                    item.onSelect?.();
                                    onSelect(item);
                                }}
                                className="gap-2"
                            >
                                {item.icon ?? <TypeIcon className="size-4" />}
                                <span>{item.label}</span>
                                {item.description ? (
                                    <span className="text-xs text-muted-foreground">
                                        {item.description}
                                    </span>
                                ) : null}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
};

const AddPanelHandle: React.FC<{ position: "end" }> = ({ position }) => {
    const [open, setOpen] = useState(false);
    const playground = usePlayground();

    return (
        <div className="flex justify-center">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
                <PlusIcon className="size-4" />
                Add panel
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Insert panel…" />
                <CommandList>
                    <CommandEmpty>No matches found.</CommandEmpty>
                    <CommandGroup heading="Panels">
                        {playground.slashItems.map((item) => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => {
                                    setOpen(false);
                                    item.onSelect?.();
                                    playground.insertPanel(
                                        item,
                                        position === "end" ? playground.blocks.length : 0
                                    );
                                }}
                                className="gap-2"
                            >
                                {item.icon ?? <TypeIcon className="size-4" />}
                                <span>{item.label}</span>
                                {item.description ? (
                                    <span className="text-xs text-muted-foreground">
                                        {item.description}
                                    </span>
                                ) : null}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const usePlayground = () => {
    const ctx = useContext(PlaygroundContext);
    if (!ctx) throw new Error("PlaygroundContext not provided");
    return ctx;
};

function buildPanelGridOptions(blocks: PlaygroundBlock[], parentPath?: string[]): GridStackOptions {
    const opts: GridStackOptions = {
        column: BASE_GRID.cols,
        cellHeight: BASE_GRID.rowHeight,
        margin: BASE_GRID.margin,
        animate: true,
        acceptWidgets: true,
        children: blocks.map((block) => ({
            id: block.id,
            x: block.layout.x,
            y: block.layout.y,
            w: block.layout.w,
            h: block.layout.h,
            content: JSON.stringify({
                type: "BLOCK_PANEL",
                panelId: block.id,
                parentPath: parentPath ?? [],
            }),
        })),
    };
    return opts;
}

function initialBlocks(): PlaygroundBlock[] {
    return [createContactBlock(), createProjectMetricsBlock(), createInvoiceSummaryBlock()];
}

const uniqueId = (prefix: string) =>
    `${prefix}-${
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }`;

/* ----- Factory functions for demo content ----- */

function createContactBlock(): PlaygroundBlock {
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
                        links: { profile: "/clients/client-1111" },
                        avatarUrl: "https://avatar.vercel.sh/jane",
                    },
                    refs: [],
                    meta: { validationErrors: [] },
                },
            },
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
        id: uniqueId("panel"),
        title: "Contact overview",
        description: "Primary client information and inline addresses.",
        badge: "Default template",
        tree,
        display,
        layout: { x: 0, y: 0, w: 6, h: 8 },
        children: [],
    };
}

function createProjectMetricsBlock(): PlaygroundBlock {
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
        id: uniqueId("panel"),
        title: "Project health",
        description: "Live status and owned tasks for the current project.",
        badge: "Nested layout",
        tree,
        display,
        layout: { x: 6, y: 0, w: 6, h: 10 },
        children: [],
    };
}

function createInvoiceSummaryBlock(): PlaygroundBlock {
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
        id: uniqueId("panel"),
        title: "Billing overview",
        description: "Snapshot of recent invoices with quick access to creation.",
        badge: "Finance",
        tree,
        display,
        layout: { x: 0, y: 10, w: 12, h: 12 },
        children: [],
    };
}

function createBlankNoteBlock(layout: LayoutRect = { x: 0, y: 0, w: 12, h: 6 }): PlaygroundBlock {
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
        id: uniqueId("panel"),
        title: "Untitled note",
        description: "A lightweight freeform note.",
        badge: "Draft",
        tree,
        display,
        layout,
        children: [],
    };
}

function createPlaceholderBlock(type: string, label?: string): PlaygroundBlock {
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
        id: uniqueId("panel"),
        title: label ?? type,
        description: "Placeholder block. Replace with real data.",
        badge: "New",
        tree,
        display,
        layout: { x: 0, y: 0, w: 12, h: 6 },
        children: [],
    };
}

function createBlockFromSlashItem(
    item: SlashMenuItem,
    layout: LayoutRect = { x: 0, y: 0, w: 12, h: 8 }
): PlaygroundBlock | null {
    switch (item.id) {
        case "CONTACT_CARD":
            return { ...createContactBlock(), layout };
        case "LAYOUT_CONTAINER":
        case "LINE_ITEM":
            return { ...createProjectMetricsBlock(), layout };
        case "TABLE":
        case "BUTTON":
            return { ...createInvoiceSummaryBlock(), layout };
        case "TEXT":
        case "BLANK_NOTE":
            return createBlankNoteBlock(layout);
        default:
            return { ...createPlaceholderBlock(item.id, item.label), layout };
    }
}

/* ----- State helpers ----- */

function findBlock(
    blocks: PlaygroundBlock[],
    panelId: string,
    parentPath: string[] = []
): PlaygroundBlock | undefined {
    if (parentPath.length === 0) {
        return blocks.find((block) => block.id === panelId);
    }
    const [current, ...rest] = parentPath;
    const parent = blocks.find((block) => block.id === current);
    if (!parent) return undefined;
    if (rest.length === 0) {
        return parent.children?.find((child) => child.id === panelId);
    }
    return parent.children ? findBlock(parent.children, panelId, rest) : undefined;
}

function findChildren(blocks: PlaygroundBlock[], parentPath?: string[]): PlaygroundBlock[] {
    if (!parentPath || parentPath.length === 0) return blocks;
    let current: PlaygroundBlock | undefined;
    for (const id of parentPath) {
        if (!current) {
            current = blocks.find((block) => block.id === id);
        } else {
            current = current.children?.find((child) => child.id === id);
        }
        if (!current) break;
    }
    return current?.children ?? [];
}

function findBlockById(blocks: PlaygroundBlock[], id: string): PlaygroundBlock | undefined {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children) {
            const found = findBlockById(block.children, id);
            if (found) return found;
        }
    }
    return undefined;
}

function addChildBlock(
    blocks: PlaygroundBlock[],
    parentId: string,
    child: PlaygroundBlock,
    position?: number
): PlaygroundBlock[] {
    return blocks.map((block) => {
        if (block.id === parentId) {
            const children = [...(block.children ?? [])];
            const insertAt = position === undefined ? children.length : position;
            children.splice(insertAt, 0, child);
            return { ...block, children };
        }
        if (block.children) {
            return { ...block, children: addChildBlock(block.children, parentId, child, position) };
        }
        return block;
    });
}

function removeBlockById(blocks: PlaygroundBlock[], targetId: string): PlaygroundBlock[] {
    return blocks
        .filter((block) => block.id !== targetId)
        .map((block) =>
            block.children
                ? { ...block, children: removeBlockById(block.children, targetId) }
                : block
        );
}

function duplicateBlockById(blocks: PlaygroundBlock[], targetId: string): PlaygroundBlock[] {
    const result: PlaygroundBlock[] = [];
    blocks.forEach((block) => {
        result.push(block);
        if (block.id === targetId) {
            const clone = cloneBlock(block);
            result.push(clone);
        }
        if (block.children) {
            const children = duplicateBlockById(block.children, targetId);
            if (children !== block.children) {
                const updated = result[result.length - 1];
                result[result.length - 1] = { ...updated, children };
            }
        }
    });
    return result;
}

function cloneBlock(block: PlaygroundBlock): PlaygroundBlock {
    return {
        ...block,
        id: uniqueId("panel"),
        layout: { ...block.layout, y: block.layout.y + block.layout.h + 2 },
        tree: JSON.parse(JSON.stringify(block.tree)),
        display: JSON.parse(JSON.stringify(block.display)),
        children: block.children ? block.children.map(cloneBlock) : undefined,
    };
}

function nextLayout(existing: PlaygroundBlock[], defaultWidth = 12, defaultHeight = 8): LayoutRect {
    const maxY = existing.reduce((acc, panel) => Math.max(acc, panel.layout.y + panel.layout.h), 0);
    return {
        x: 0,
        y: maxY + 2,
        w: defaultWidth,
        h: defaultHeight,
    };
}

function updateLayouts(
    blocks: PlaygroundBlock[],
    parentPath: string[] | null,
    updates: LayoutUpdate[]
): PlaygroundBlock[] {
    if (!parentPath || parentPath.length === 0) {
        return blocks.map((block) => {
            const update = updates.find((item) => item.id === block.id);
            if (!update) return block;
            return { ...block, layout: { x: update.x, y: update.y, w: update.w, h: update.h } };
        });
    }

    const [parentId, ...rest] = [...parentPath];
    return blocks.map((block) => {
        if (block.id !== parentId) return block;
        if (!block.children) return block;
        return {
            ...block,
            children: updateLayouts(block.children, rest.length ? rest : null, updates),
        };
    });
}
