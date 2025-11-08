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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridStackOptions } from "gridstack";
import {
    BlockEnvironmentProvider,
    useBlockEnvironment,
} from "../../context/block-environment-provider";
import { BlockEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";
import { BlockNode, BlockTree } from "../../interface/block.interface";
import { EditorEnvironment } from "../../interface/editor.interface";
import { SlashMenuItem } from "../../interface/panel.interface";
import {
    createLayoutContainerNode,
    createNoteNode,
    createTaskListNode,
} from "../../util/block/factory/mock.factory";
import { editorPanel } from "../panel/editor-panel";
import { defaultSlashItems } from "../panel/panel-wrapper";
import { WidgetEnvironmentSync } from "../sync/widget.sync";

const DEMO_ORG_ID = "demo-org-12345";

/* -------------------------------------------------------------------------- */
/*                           Demo Component                                   */
/* -------------------------------------------------------------------------- */

export const BlockDemo = () => {
    const blocks = useMemo(() => createDemoTrees(), []);
    return (
        <BlockEnvironmentProvider organisationId={DEMO_ORG_ID} initialTrees={blocks}>
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
    const { environment } = useBlockEnvironment();

    const options: GridStackOptions = {
        sizeToContent: true,
        resizable: {
            handles: "se, sw", // Only corner handles for cleaner appearance
        },
        draggable: {
            cancel: ".block-no-drag",
            pause: 200,
        },
        columnOpts: {
            breakpoints: [
                //md
                {
                    w: 1024,
                    c: 6,
                },
                //sm
                {
                    w: 768,
                    c: 1,
                },
            ],
        },
        // cellHeight: 50,
        margin: 8,
        animate: true,
        acceptWidgets: true,
    };

    useEffect(() => {
        console.log(environment);
    }, [environment]);

    return (
        <>
            <GridProvider initialOptions={options}>
                <WorkspaceToolbar />
                <BlockEnvironmentGridSync />
                <WidgetEnvironmentSync />
                <GridContainerProvider>
                    <BlockRenderer />
                </GridContainerProvider>
            </GridProvider>
            <DebugInfo />
        </>
    );
};

/**
 * Renders all blocks with proper wrapping (PanelWrapper for toolbar, slash menu, etc.)
 */
const BlockRenderer: React.FC = () => {
    const { getBlock, removeBlock, insertBlock, getParent, moveBlockUp, moveBlockDown } =
        useBlockEnvironment();

    const { wrapper } = editorPanel({
        getBlock,
        insertBlock,
        removeBlock,
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
    const { addBlock } = useBlockEnvironment();

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
                addBlock(createLayoutContainerNode(DEMO_ORG_ID));
                break;
            case "TEXT":
            case "BLANK_NOTE":
                addBlock(createNoteNode(DEMO_ORG_ID));
                break;
            default:
                addBlock(createNoteNode(DEMO_ORG_ID, `New ${item.label}`));
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

function createDemoTrees(): BlockTree[] {
    // Create a layout container (demonstrates wildcard slots)
    const layoutNode = createLayoutContainerNode(DEMO_ORG_ID);
    const layoutTree: BlockTree = {
        type: "block_tree",
        root: layoutNode,
    };

    // Create a task list (demonstrates content block list with manual ordering)
    const taskListNode = createTaskListNode(DEMO_ORG_ID);
    const taskListTree: BlockTree = {
        type: "block_tree",
        root: taskListNode,
    };

    const noteNode = createNoteNode(DEMO_ORG_ID, "Standalone note block");
    const noteTree: BlockTree = {
        type: "block_tree",
        root: noteNode,
    };

    return [layoutTree, taskListTree, noteTree];
}
