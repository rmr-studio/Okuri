"use client";

import { Button } from "@/components/ui/button";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import "gridstack/dist/gridstack.css";
import { PlusIcon, SaveIcon, TypeIcon } from "lucide-react";
import React, { FC, Fragment, useEffect, useMemo, useState } from "react";
import "../../styles/gridstack-custom.css";

import { RenderElementProvider } from "@/components/feature-modules/blocks/context/block-renderer-provider";
import { GridContainerProvider } from "@/components/feature-modules/blocks/context/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import { LayoutChangeProvider } from "@/components/feature-modules/blocks/context/layout-change-provider";
import { useTrackedEnvironment } from "@/components/feature-modules/blocks/context/tracked-environment-provider";
import { BlockFocusProvider } from "../../context/block-focus-provider";
import { BlockTreeLayout } from "../../interface/layout.interface";
import { KeyboardNavigationHandler } from "../navigation/keyboard-navigation-handler";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridStackOptions } from "gridstack";
import { BlockEditProvider } from "../../context/block-edit-provider";
import {
    BlockEnvironmentProvider,
    useBlockEnvironment,
} from "../../context/block-environment-provider";
import { LayoutHistoryProvider } from "../../context/layout-history-provider";
import { TrackedEnvironmentProvider } from "../../context/tracked-environment-provider";
import { BlockEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";
import {
    BlockComponentNode,
    BlockNode,
    BlockRenderStructure,
    BlockTree,
    BlockType,
    TreeLayout,
} from "../../interface/block.interface";
import { EditorEnvironment } from "../../interface/editor.interface";
import { SlashMenuItem } from "../../interface/panel.interface";
import { createBlockType, createContentNode } from "../../util/block/factory/block.factory";
import { createLayoutContainerNode, createNoteNode } from "../../util/block/factory/mock.factory";
import {
    createContentBlockListType,
    createLayoutContainerBlockType,
    DEFAULT_GRID_LAYOUT,
} from "../../util/block/factory/type.factory";
import { BlockEditDrawer, EditModeIndicator } from "../forms";
import { editorPanel } from "../panel/editor-panel";
import { defaultSlashItems } from "../panel/panel-wrapper";
import { WidgetEnvironmentSync } from "../sync/widget.sync";

const DEMO_ORG_ID = "eda60a2a-641a-40fe-be2a-03eb8a56bb0c";
export const DEFAULT_WIDGET_OPTIONS: GridStackOptions = {
    sizeToContent: true,
    resizable: {
        handles: "se, sw", // Only corner handles for cleaner appearance
    },
    draggable: {
        cancel: ".no-drag",
        pause: 5,
    },
    column: 23,
    columnOpts: {
        breakpoints: [
            //md
            {
                w: 1024,
                c: 12,
            },
            //sm
            {
                w: 768,
                c: 1,
            },
        ],
    },
    cellHeight: 25,
    animate: true,
    acceptWidgets: true,
};

/* -------------------------------------------------------------------------- */
/*                           Demo Component                                   */
/* -------------------------------------------------------------------------- */

export const BlockDemo = () => {
    const { trees, blockTreeLayout } = useMemo(() => createDemoEnvironment(), []);
    return (
        <BlockEnvironmentProvider
            organisationId={DEMO_ORG_ID}
            initialTrees={trees}
            blockTreeLayout={blockTreeLayout}
        >
            <div className="mx-auto space-y-8 p-6">
                <header className="space-y-2">
                    <h1 className="text-2xl font-semibold">Block Environment Demo</h1>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        Block environment with real-time hierarchy tracking. Drag, resize, and nest
                        blocks. Use the slash menu inside panels to add nested blocks.
                    </p>
                </header>

                <BlockEnvironmentWorkspace />
            </div>
        </BlockEnvironmentProvider>
    );
};

/* -------------------------------------------------------------------------- */
/*                          Workspace Component                               */
/* -------------------------------------------------------------------------- */

const WorkspaceToolbar: FC = () => {
    const { save } = useGrid();
    const handleSave = () => {
        const result = save();
        console.log("Saved grid options:", result);
    };
    return (
        <section className="mb flex">
            <Button onClick={handleSave}>
                <SaveIcon className="size-4" />
                Save
            </Button>
            <AddBlockButton />
        </section>
    );
};

const BlockEnvironmentWorkspace: React.FC = () => {
    const { blockTreeLayout } = useBlockEnvironment();
    const gridOptions = blockTreeLayout?.layout ?? DEFAULT_WIDGET_OPTIONS;

    return (
        <>
            <GridProvider initialOptions={gridOptions}>
                <LayoutHistoryProvider>
                    <LayoutChangeProvider>
                        <TrackedEnvironmentProvider>
                            <BlockFocusProvider>
                                <BlockEditProvider>
                                    <EditModeIndicator />
                                    <KeyboardNavigationHandler />
                                    <WorkspaceToolbar />
                                    <BlockEnvironmentGridSync />
                                    <WidgetEnvironmentSync />
                                    <GridContainerProvider>
                                        <BlockRenderer />
                                    </GridContainerProvider>
                                    <BlockEditDrawer />
                                </BlockEditProvider>
                            </BlockFocusProvider>
                        </TrackedEnvironmentProvider>
                    </LayoutChangeProvider>
                </LayoutHistoryProvider>
            </GridProvider>
            <DebugInfo />
        </>
    );
};

/**
 * Renders all blocks with proper wrapping (PanelWrapper for toolbar, slash menu, etc.)
 */
const BlockRenderer: React.FC = () => {
    const { getBlock, getParent, moveBlockUp, moveBlockDown } = useBlockEnvironment();
    const { removeTrackedBlock, addTrackedBlock } = useTrackedEnvironment();

    const { wrapper } = editorPanel({
        getBlock,
        insertBlock: (child, parentId, index) => addTrackedBlock(child, parentId, index),
        removeBlock: removeTrackedBlock,
        getParent,
        moveBlockUp,
        moveBlockDown,
    });

    return <RenderElementProvider wrapElement={wrapper} />;
};

/**
 * Helper to create a block node from a slash menu item
 */
function createNodeFromSlashItem(item: SlashMenuItem, organisationId: string): BlockNode | null {
    switch (item.id) {
        case "LAYOUT_CONTAINER":
        case "LINE_ITEM":
            return createLayoutContainerNode(organisationId);
        case "TEXT":
        case "BLANK_NOTE":
            return createNoteNode(organisationId);
        default:
            return createNoteNode(organisationId, `New ${item.label}`);
    }
}

const DebugInfo = () => {
    "use client";
    const { environment } = useBlockEnvironment();
    const [snapshot, setSnapshot] = useState<string>("");

    useEffect(() => {
        setSnapshot(formatEnvironment(environment));
    }, [environment]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
                <div>
                    <h3 className="mb-2 font-semibold">Environment Snapshot</h3>
                    <pre className="bg-muted text-muted-foreground p-4 text-sm">
                        {snapshot || "Collecting environment state…"}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
};

function formatEnvironment(environment: EditorEnvironment): string {
    const serialisable = {
        metadata: environment.metadata,
        trees: environment.trees,
        hierarchy: Array.from(environment.hierarchy.entries()),
        treeIndex: Array.from(environment.treeIndex.entries()),
    };

    return JSON.stringify(serialisable, null, 2);
}

/**
 * Button to add new blocks
 */
const AddBlockButton: React.FC = () => {
    const [open, setOpen] = useState(false);
    const { addTrackedBlock } = useTrackedEnvironment();

    const slashItems: SlashMenuItem[] = [
        ...defaultSlashItems,
        {
            id: "BLANK_NOTE",
            label: "Blank note",
            description: "Start with an unstructured text block",
            icon: <TypeIcon className="size-4" />,
        },
    ];

    const handleSelect = (item: SlashMenuItem) => {
        setOpen(false);

        switch (item.id) {
            case "LAYOUT_CONTAINER":
            case "LINE_ITEM":
                addTrackedBlock(createLayoutContainerNode(DEMO_ORG_ID));
                break;
            case "TEXT":
            case "BLANK_NOTE":
                addTrackedBlock(createNoteNode(DEMO_ORG_ID));
                break;
            default:
                addTrackedBlock(createNoteNode(DEMO_ORG_ID, `New ${item.label}`));
                break;
        }
    };

    return (
        <Fragment>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
                <PlusIcon className="size-4" />
                Add block
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Insert block…" />
                <CommandList>
                    <CommandEmpty>No matches found.</CommandEmpty>
                    <CommandGroup heading="Blocks">
                        {slashItems.map((item) => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => handleSelect(item)}
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
        </Fragment>
    );
};

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

// Note: buildGridEnvironment has been replaced by buildGridEnvironmentWithWidgetMap
// from util/render/render.tree.ts which recursively builds widgets for the entire tree

/**
 * Helper to create a note block type (inlined from mock.factory)
 */
function createNoteBlockType(organisationId: string): BlockType {
    const component: BlockComponentNode = {
        id: "note",
        type: "TEXT",
        props: {
            variant: "body",
        },
        bindings: [{ prop: "text", source: { type: "DataPath", path: "$.data/content" } }],
        fetchPolicy: "LAZY",
    };

    const render: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [
                {
                    id: component.id,
                    rect: { x: 0, y: 0, width: 12, height: 4, locked: false },
                },
            ],
        },
        components: { [component.id]: component },
    };

    return createBlockType({
        key: "note",
        name: "Note",
        description: "Simple rich text note.",
        organisationId,
        schema: {
            name: "Note",
            type: "OBJECT",
            required: true,
            properties: {
                content: { name: "Content", type: "STRING", required: true },
            },
        },
        display: {
            form: {
                fields: {
                    "data.content": {
                        type: "TEXT_AREA",
                        label: "Note Content",
                        placeholder: "Start typing your note...",
                    },
                },
            },
            render,
        },
        nesting: null,
    });
}

/**
 * Helper to create a task block type (inlined from mock.factory)
 */
function createTaskBlockType(organisationId: string): BlockType {
    const component: BlockComponentNode = {
        id: "task",
        type: "TEXT",
        props: {
            variant: "body",
        },
        bindings: [
            {
                prop: "text",
                source: { type: "DataPath", path: "$.data/title" },
            },
        ],
        fetchPolicy: "LAZY",
    };

    const render: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [
                {
                    id: component.id,
                    rect: { x: 0, y: 0, width: 12, height: 4, locked: false },
                },
            ],
        },
        components: { [component.id]: component },
    };

    return createBlockType({
        key: "project_task",
        name: "Project Task",
        description: "Individual task item for a project.",
        organisationId,
        schema: {
            name: "Task",
            type: "OBJECT",
            required: true,
            properties: {
                title: { name: "Title", type: "STRING", required: true },
                assignee: { name: "Assignee", type: "STRING", required: false },
                status: { name: "Status", type: "STRING", required: false },
                dueDate: { name: "Due date", type: "STRING", required: false, format: "DATE" },
            },
        },
        display: {
            form: {
                fields: {
                    "data.title": {
                        type: "TEXT_INPUT",
                        label: "Task Title",
                        placeholder: "Enter task title",
                    },
                    "data.assignee": {
                        type: "TEXT_INPUT",
                        label: "Assignee",
                        placeholder: "Who is responsible?",
                    },
                    "data.status": {
                        type: "DROPDOWN",
                        label: "Status",
                        options: [
                            { label: "Not Started", value: "NOT_STARTED" },
                            { label: "In Progress", value: "IN_PROGRESS" },
                            { label: "In Review", value: "IN_REVIEW" },
                            { label: "Completed", value: "COMPLETED" },
                        ],
                    },
                    "data.dueDate": {
                        type: "DATE_PICKER",
                        label: "Due Date",
                        placeholder: "Select due date",
                    },
                },
            },
            render,
        },
        nesting: null,
    });
}

/**
 * Helper to create a task list node with a specific ID
 */
function createTaskListNodeWithId(organisationId: string, id: string): BlockNode {
    const listType = createContentBlockListType(organisationId);
    const taskType = createTaskBlockType(organisationId);

    // Create task items
    const tasks = [
        createContentNode({
            organisationId,
            type: taskType,
            data: {
                title: "Design wireframes",
                assignee: "Jane Doe",
                status: "IN_PROGRESS",
                dueDate: "2024-12-15",
            },
            name: "Design wireframes",
        }),
        createContentNode({
            organisationId,
            type: taskType,
            data: {
                title: "Implement authentication",
                assignee: "John Smith",
                status: "NOT_STARTED",
                dueDate: "2024-12-20",
            },
            name: "Implement authentication",
        }),
        createContentNode({
            organisationId,
            type: taskType,
            data: {
                title: "Write documentation",
                assignee: "Alice Johnson",
                status: "NOT_STARTED",
                dueDate: "2024-12-25",
            },
            name: "Write documentation",
        }),
    ];

    return createContentNode({
        id,
        organisationId,
        type: listType,
        name: "Project Tasks",
        data: {
            title: "Project Tasks",
            description: "Drag to reorder tasks",
        },
        children: tasks,
        payloadOverride: {
            type: "content",
            deletable: true,
            meta: { validationErrors: [] },
            data: {
                title: "Project Tasks",
                description: "Drag to reorder tasks",
            },
            listConfig: {
                allowedTypes: ["project_task"],
                allowDuplicates: false,
                display: {
                    itemSpacing: 12,
                    showDragHandles: true,
                    emptyMessage: "No tasks yet. Add one to get started!",
                },
                config: {
                    mode: "SORTED",
                    sort: {
                        by: "data.dueDate",
                        dir: "ASC",
                    },
                    filters: [],
                    filterLogic: "AND",
                },
            },
        },
    });
}

interface DemoEnvironmentResult {
    trees: BlockTree[];
    blockTreeLayout: BlockTreeLayout;
}

function createDemoEnvironment(): DemoEnvironmentResult {
    // Define IDs that match the layout below
    const STANDALONE_NOTE_ID = "c5745236-a506-4410-994d-4ee9d17c07f2";
    const LAYOUT_CONTAINER_ID = "7b648d3c-94d1-4988-8530-fc49f6fc2b16";
    const NESTED_NOTE_1_ID = "2eb29c0a-a7c8-4033-be94-7977466feaf4";
    const NESTED_NOTE_2_ID = "4b907540-2d30-43a8-a12c-b7c574ef2f32";
    const TASK_LIST_ID = "f79f702b-f858-479a-a415-261a76d81bdb";

    // Create blocks with specific IDs to match the layout
    const noteType = createNoteBlockType(DEMO_ORG_ID);
    const layoutType = createLayoutContainerBlockType(DEMO_ORG_ID);

    // Create nested blocks for layout container
    const nestedNote1 = createContentNode({
        id: NESTED_NOTE_1_ID,
        organisationId: DEMO_ORG_ID,
        type: noteType,
        name: "Welcome note",
        data: {
            content:
                "Welcome to the block environment! This is a nested block inside a layout container.",
        },
    });

    const nestedNote2 = createContentNode({
        id: NESTED_NOTE_2_ID,
        organisationId: DEMO_ORG_ID,
        type: noteType,
        name: "Instructions",
        data: {
            content:
                "You can add, remove, and rearrange blocks using the toolbar. Try dragging blocks around!",
        },
    });

    // Create layout container with nested blocks
    const layoutNode = createContentNode({
        id: LAYOUT_CONTAINER_ID,
        organisationId: DEMO_ORG_ID,
        type: layoutType,
        name: "Getting Started",
        data: {
            title: "Getting Started",
            description: "An introduction to block environments",
        },
        children: [nestedNote1, nestedNote2],
    });

    const layoutTree: BlockTree = {
        type: "block_tree",
        root: layoutNode,
    };

    // Create a task list (demonstrates content block list with manual ordering)
    const taskListNode = createTaskListNodeWithId(DEMO_ORG_ID, TASK_LIST_ID);
    const taskListTree: BlockTree = {
        type: "block_tree",
        root: taskListNode,
    };

    // Create standalone note
    const noteNode = createContentNode({
        id: STANDALONE_NOTE_ID,
        organisationId: DEMO_ORG_ID,
        type: noteType,
        name: "Standalone note",
        data: {
            content: "Standalone note block",
        },
    });

    const noteTree: BlockTree = {
        type: "block_tree",
        root: noteNode,
    };

    const gridLayout: TreeLayout = {
        sizeToContent: true,
        resizable: {
            handles: "se, sw",
        },
        draggable: {
            cancel: ".no-drag",
            pause: 5,
        },
        columnOpts: {
            breakpoints: [
                {
                    w: 1024,
                    c: 12,
                },
                {
                    w: 768,
                    c: 1,
                },
            ],
            columnMax: 12,
        },
        acceptWidgets: true,
        cellHeight: 25,
        children: [
            {
                id: "c5745236-a506-4410-994d-4ee9d17c07f2",
                x: 0,
                y: 0,
                w: 12,
                h: 4,
                content: {
                    id: "c5745236-a506-4410-994d-4ee9d17c07f2",
                    key: "note",
                    renderType: "component",
                    blockType: "content_node",
                },
            },
            {
                id: "7b648d3c-94d1-4988-8530-fc49f6fc2b16",
                x: 0,
                y: 4,
                w: 6,
                h: 15,
                subGridOpts: {
                    sizeToContent: true,
                    resizable: {
                        handles: "se, sw",
                    },
                    draggable: {
                        cancel: ".no-drag",
                        pause: 5,
                    },
                    column: "auto",
                    acceptWidgets: true,
                    alwaysShowResizeHandle: false,
                    layout: "list",
                    class: "grid-stack-subgrid",
                    cellHeight: 25,
                    children: [
                        {
                            id: "2eb29c0a-a7c8-4033-be94-7977466feaf4",
                            x: 0,
                            y: 1,
                            w: 6,
                            h: 4,
                            content: {
                                id: "2eb29c0a-a7c8-4033-be94-7977466feaf4",
                                key: "note",
                                renderType: "component",
                                blockType: "content_node",
                            },
                        },
                        {
                            id: "4b907540-2d30-43a8-a12c-b7c574ef2f32",
                            x: 0,
                            y: 5,
                            w: 6,
                            h: 5,
                            content: {
                                id: "4b907540-2d30-43a8-a12c-b7c574ef2f32",
                                key: "note",
                                renderType: "component",
                                blockType: "content_node",
                            },
                        },
                    ],
                },
                content: {
                    id: "7b648d3c-94d1-4988-8530-fc49f6fc2b16",
                    key: "layout_container",
                    renderType: "container",
                    blockType: "content_node",
                },
            },
            {
                id: "f79f702b-f858-479a-a415-261a76d81bdb",
                x: 6,
                y: 4,
                w: 6,
                h: 11,
                content: {
                    id: "f79f702b-f858-479a-a415-261a76d81bdb",
                    key: "content_block_list",
                    renderType: "list",
                    blockType: "content_node",
                },
            },
        ],
    };

    // Wrap GridStack layout in BlockTreeLayout object for persistence tracking
    const blockTreeLayout: BlockTreeLayout = {
        version: 1,
        id: "8bfc08df-5131-4299-9090-802f7ff01fd2", // Mock ID for demo
        organisationId: DEMO_ORG_ID,
        layout: gridLayout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return {
        trees: [layoutTree, taskListTree, noteTree],
        blockTreeLayout,
    };
}
