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

import { GridContainerProvider } from "@/components/feature-modules/grid/provider/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/grid/provider/grid-provider";
import { RenderElementProvider } from "@/components/feature-modules/render/provider/render-element-provider";

import {
    BlockEnvironmentProvider,
    useBlockEnvironment,
} from "../../context/block-environment-provider";
import { useEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";
import { BlockTree } from "../../interface/block.interface";
import { getCurrentDimensions } from "../../util/block/block.util";
import {
    createContactBlockTree,
    createContactBlockType,
    createNoteBlockTree,
} from "../../util/block/factory/mock.factory";
import { createLayoutContainerBlockType } from "../../util/block/factory/type.factory";
import { editorPanelRegistry } from "../panel/editor-panel";
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

                <BlockEnvironmentWorkspace />

                <AddBlockButton />
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
        <GridProvider initialOptions={gridOptions}>
            <BlockEnvironmentGridSync parentId={null} />
            <GridStackWidgetSync />
            <GridContainerProvider>
                <RenderElementProvider registry={editorPanelRegistry} />
            </GridContainerProvider>
        </GridProvider>
    );
};

/**
 * Synchronizes GridStack with BlockEnvironment
 */
const BlockEnvironmentGridSync: React.FC<{ parentId: string | null }> = ({ parentId }) => {
    useEnvironmentGridSync(parentId);
    return null;
};

/**
 * Synchronizes GridStack widgets when top-level blocks change
 */
const GridStackWidgetSync: React.FC = () => {
    const { gridStack, _rawWidgetMetaMap } = useGrid();
    const { getTopLevelBlocks } = useBlockEnvironment();
    const topLevelBlocks = getTopLevelBlocks();
    const topLevelBlocksRef = useRef(topLevelBlocks);

    // Track previous block IDs to detect changes
    const prevBlockIdsRef = useRef(new Set<string>());

    useEffect(() => {
        topLevelBlocksRef.current = topLevelBlocks;
    }, [topLevelBlocks]);

    useEffect(() => {
        if (!gridStack) return;

        const currentBlockIds = new Set(topLevelBlocks.map((b) => b.tree.root.block.id));
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
            const blockInstance = topLevelBlocks.find((b) => b.tree.root.block.id === blockId);
            if (!blockInstance) return;

            const alreadyInGrid = gridStack.engine.nodes?.some(
                (node) => String(node.id) === blockId
            );
            if (alreadyInGrid) {
                return;
            }

            console.log(`Adding widget ${blockId} to GridStack`);

            const widgetConfig = {
                id: blockId,
                x: blockInstance.layout.x,
                y: blockInstance.layout.y,
                w: blockInstance.layout.w,
                h: blockInstance.layout.h,
                content: JSON.stringify({
                    type: "EDITOR_PANEL",
                    blockId: blockId,
                }),
            };

            console.log("Add");
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

        let tree;
        switch (item.id) {
            case "CONTACT_CARD":
                tree = createContactBlockType(DEMO_ORG_ID);
                break;
            case "LAYOUT_CONTAINER":
            case "LINE_ITEM":
                tree = createLayoutContainerBlockType(DEMO_ORG_ID);
                break;
            case "TEXT":
            case "BLANK_NOTE":
                tree = createNoteBlockTree(DEMO_ORG_ID);
                break;
            default:
                tree = createNoteBlockTree(DEMO_ORG_ID, `New ${item.label}`);
                break;
        }

        // Add block to environment (layout will be calculated automatically)
        addBlock(tree, undefined, null);
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
 * Builds GridStack options from top-level blocks
 */
function buildGridEnvironment(blocks: BlockTree[]): GridStackOptions {
    // Base grid configuration that contains all trees
    const BASE_GRID = { cols: 12, rowHeight: 60, margin: 12 };
    return {
        column: "auto",
        cellHeight: BASE_GRID.rowHeight,
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
    const contactTree = createContactBlockTree(DEMO_ORG_ID);
    return [contactTree];
}
