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
import type { GridStackOptions } from "gridstack";
import "gridstack/dist/gridstack.css";
import { PlusIcon, TypeIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { RenderElementProvider } from "@/components/feature-modules/blocks/context/block-renderer-provider";
import { GridContainerProvider } from "@/components/feature-modules/blocks/context/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/blocks/context/grid-provider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BlockEnvironmentProvider,
    useBlockEnvironment,
} from "../../context/block-environment-provider";
import { useEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";
import { BlockTree } from "../../interface/block.interface";
import { EditorEnvironment } from "../../interface/editor.interface";
import { getCurrentDimensions } from "../../util/block/block.util";
import {
    createContactBlockNode,
    createLayoutContainerNode,
    createNoteNode,
} from "../../util/block/factory/mock.factory";
import { getTreeId } from "../../util/environment/environment.util";
import { SlashMenuItem, defaultSlashItems } from "../panel/panel-wrapper";

const DEMO_ORG_ID = "demo-org-12345";

/* -------------------------------------------------------------------------- */
/*                           Demo Component                                   */
/* -------------------------------------------------------------------------- */

export const BlockDemo = () => {
    const blocks = useMemo(() => createDemoTrees(), []);
    return (
        <BlockEnvironmentProvider organisationId={DEMO_ORG_ID} initialTrees={blocks}>
            <div className="mx-auto max-w-6xl space-y-8 p-6">
                <header className="space-y-2">
                    <h1 className="text-2xl font-semibold">Block Environment Demo</h1>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        Block environment with real-time hierarchy tracking. Drag, resize, and nest
                        blocks. Use the slash menu inside panels to add nested blocks.
                    </p>
                </header>

                <AddBlockButton />
                <BlockEnvironmentWorkspace />
            </div>
        </BlockEnvironmentProvider>
    );
};

/* -------------------------------------------------------------------------- */
/*                          Workspace Component                               */
/* -------------------------------------------------------------------------- */

const BlockEnvironmentWorkspace: React.FC = () => {
    const { getTrees } = useBlockEnvironment();
    const gridOptions = useMemo(() => buildGridEnvironment(getTrees()), [getTrees]);

    return (
        <>
            <GridProvider initialOptions={gridOptions}>
                <BlockEnvironmentGridSync parentId={null} />
                <GridStackWidgetSync />
                <GridContainerProvider>
                    <RenderElementProvider />
                </GridContainerProvider>
            </GridProvider>
            <DebugInfo />
        </>
    );
};

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
        layouts: Array.from(environment.layouts.entries()),
    };

    return JSON.stringify(serialisable, null, 2);
}

/**
 * Synchronizes GridStack with BlockEnvironment
 */
export const BlockEnvironmentGridSync: React.FC<{ parentId: string | null }> = ({ parentId }) => {
    useEnvironmentGridSync(parentId);
    return null;
};

/**
 * Synchronizes GridStack widgets when top-level blocks change
 */
const GridStackWidgetSync: React.FC = () => {
    const { gridStack, _rawWidgetMetaMap } = useGrid();

    const { getTrees } = useBlockEnvironment();
    const trees = useMemo(() => getTrees(), [getTrees]);
    const topLevelBlocks = useMemo(() => trees, [trees]);
    const topLevelBlocksRef = useRef<BlockTree[]>(topLevelBlocks);

    // Track previous block IDs to detect changes
    const prevBlockIdsRef = useRef(new Set<string>());

    useEffect(() => {
        topLevelBlocksRef.current = topLevelBlocks;
    }, [topLevelBlocks]);

    useEffect(() => {
        if (!gridStack) return;

        const currentBlockIds = new Set(topLevelBlocks.map((tree) => getTreeId(tree)));
        const prevBlockIds = prevBlockIdsRef.current;

        // Find blocks that were added
        const addedBlockIds = Array.from(currentBlockIds).filter(
            (id: string) => !prevBlockIds.has(id)
        );

        // Find blocks that were removed
        const removedBlockIds = Array.from(prevBlockIds).filter(
            (id: string) => !currentBlockIds.has(id)
        );

        // Add new widgets (skip ones GridStack already rendered from initial options)
        addedBlockIds.forEach((blockId) => {
            const blockInstance = topLevelBlocks.find((tree) => getTreeId(tree) === blockId);
            if (!blockInstance) return;

            const alreadyInGrid = gridStack.engine.nodes?.some(
                (node) => String(node.id) === blockId
            );
            if (alreadyInGrid) {
                return;
            }

            console.log(`Adding widget ${blockId} to GridStack`);
            const { x, y, width, height } = getCurrentDimensions(blockInstance.root);

            const widgetConfig = {
                id: blockId,
                x,
                y,
                w: width,
                h: height,
                content: JSON.stringify({
                    type: blockInstance.root.block.type.key,
                    blockId: blockInstance.root.block.id,
                }),
            };

            // Add to GridStack
            gridStack.addWidget(widgetConfig);

            // CRITICAL: Update rawWidgetMetaMap so RenderElementProvider can find it
            _rawWidgetMetaMap.set((prev) => {
                const newMap = new Map(prev);
                newMap.set(blockId, widgetConfig);
                return newMap;
            });
        });

        // Remove old widgets
        removedBlockIds.forEach((blockId) => {
            console.log(`Removing widget ${blockId} from GridStack`);
            const node = gridStack.engine.nodes?.find((n) => String(n.id) === blockId);
            const element =
                (node?.el as HTMLElement | undefined) ??
                (gridStack.el?.querySelector(`[gs-id='${blockId}']`) as HTMLElement | null);
            if (element) {
                gridStack.removeWidget(element, true);
            }

            // Remove from rawWidgetMetaMap
            _rawWidgetMetaMap.set((prev) => {
                const newMap = new Map(prev);
                newMap.delete(blockId);
                return newMap;
            });
        });

        // Update the ref for next render
        prevBlockIdsRef.current = currentBlockIds;
    }, [gridStack, topLevelBlocks, _rawWidgetMetaMap]);

    return null;
};

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
            case "CONTACT_CARD":
                addBlock(createContactBlockNode(DEMO_ORG_ID));
                break;
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
        <div className="flex justify-center">
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
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

/**
 * Builds GridStack options the environment grid, and maps top-level blocks as base grid widgets
 */
function buildGridEnvironment(blocks: BlockTree[]): GridStackOptions {
    // Base grid configuration that contains all trees
    const BASE_GRID = { cols: 12, margin: 12 };
    return {
        column: "auto",
        sizeToContent: true,
        margin: BASE_GRID.margin,
        animate: true,
        acceptWidgets: true,
        children: blocks.map((blockInstance) => {
            const node = blockInstance.root;
            const grid = getCurrentDimensions(node);
            return {
                id: node.block.id,
                x: grid.x,
                y: grid.y,
                w: grid.width,
                h: grid.height,
                content: JSON.stringify({
                    type: node.block.type.key,
                    blockId: node.block.id,
                }),
            };
        }),
    };
}

function createDemoTrees(): BlockTree[] {
    const node = createContactBlockNode(DEMO_ORG_ID);
    const contactTree: BlockTree = {
        type: "block_tree",
        root: node,
    };
    return [contactTree];
}
