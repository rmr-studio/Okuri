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
    EditorBlockInstance,
    EditorEnvironment,
    useBlockEnvironment,
} from "../../context/block-environment-provider";
import { useEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";
import { BlockNode } from "../../interface/block.interface";
import {
    createBlankPanelTree,
    createContactBlockTree,
    createNoteBlockTree,
    createProjectBlockTree,
} from "../../util/block-factories";
import { editorPanelRegistry } from "../panel/editor-panel";
import { SlashMenuItem, defaultSlashItems } from "../panel/panel-wrapper";

const DEMO_ORG_ID = "demo-org-12345";

/* -------------------------------------------------------------------------- */
/*                           Demo Component                                   */
/* -------------------------------------------------------------------------- */

export const BlockDemo = () => {
    return (
        <BlockEnvironmentProvider
            organisationId={DEMO_ORG_ID}
            initialEnvironment={createDemoEnvironment()}
        >
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
    const { getTopLevelBlocks } = useBlockEnvironment();
    const topLevelBlocks = getTopLevelBlocks();

    const gridOptions = useMemo(() => {
        return buildGridOptions(topLevelBlocks);
    }, [topLevelBlocks]);

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

        // Add new widgets
        addedBlockIds.forEach((blockId) => {
            const blockInstance = topLevelBlocks.find((b) => b.tree.root.block.id === blockId);
            if (!blockInstance) return;

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
            const element = gridStack.engine.nodes.find((n: any) => String(n.id) === blockId)?.el;
            if (element) {
                gridStack.removeWidget(element, false);
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
        {
            id: "__NEW_PANEL__",
            label: "Panel",
            description: "Create a blank panel for nested layouts",
            icon: <TypeIcon className="size-4" />,
        },
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
            case "__NEW_PANEL__":
                tree = createBlankPanelTree(DEMO_ORG_ID);
                break;
            case "CONTACT_CARD":
                tree = createContactBlockTree(DEMO_ORG_ID);
                break;
            case "LAYOUT_CONTAINER":
            case "LINE_ITEM":
                tree = createProjectBlockTree(DEMO_ORG_ID);
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
function buildGridOptions(blocks: EditorBlockInstance[]): GridStackOptions {
    const BASE_GRID = { cols: 12, rowHeight: 60, margin: 12 };

    return {
        column: BASE_GRID.cols,
        cellHeight: BASE_GRID.rowHeight,
        margin: BASE_GRID.margin,
        animate: true,
        acceptWidgets: true,
        children: blocks.map((blockInstance) => ({
            id: blockInstance.tree.root.block.id,
            x: blockInstance.layout.x,
            y: blockInstance.layout.y,
            w: blockInstance.layout.w,
            h: blockInstance.layout.h,
            content: JSON.stringify({
                type: "EDITOR_PANEL",
                blockId: blockInstance.tree.root.block.id,
            }),
        })),
    };
}

/**
 * Creates initial demo environment
 */
function createDemoEnvironment(): EditorEnvironment {
    const contactTree = createContactBlockTree(DEMO_ORG_ID);
    const projectTree = createProjectBlockTree(DEMO_ORG_ID);

    const topLevelBlocks: EditorBlockInstance[] = [
        {
            tree: contactTree,
            layout: { x: 0, y: 0, w: 6, h: 12 },
            uiMetadata: {},
        },
        {
            tree: projectTree,
            layout: { x: 6, y: 0, w: 6, h: 14 },
            uiMetadata: {},
        },
    ];

    // Extract all nested blocks from BlockTrees and build complete hierarchy
    const { allBlocks, hierarchyMap } = extractAllBlocksFromTrees(topLevelBlocks);

    return {
        blocks: topLevelBlocks,
        hierarchy: {
            parentMap: hierarchyMap,
        },
        metadata: {
            name: "Demo Environment",
            description: "A demo workspace with sample blocks",
            organisationId: DEMO_ORG_ID,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    };
}

/**
 * Extracts all blocks (including nested children) from BlockTrees
 * and builds a complete hierarchy map
 */
function extractAllBlocksFromTrees(topLevelBlocks: EditorBlockInstance[]): {
    allBlocks: EditorBlockInstance[];
    hierarchyMap: Map<string, string | null>;
} {
    const allBlocks: EditorBlockInstance[] = [];
    const hierarchyMap = new Map<string, string | null>();

    // Process each top-level block
    topLevelBlocks.forEach((topLevelBlock) => {
        const parentId = null; // Top-level blocks have no parent

        // Add top-level block
        allBlocks.push(topLevelBlock);
        hierarchyMap.set(topLevelBlock.tree.root.block.id, parentId);

        // Recursively extract nested children from the BlockTree
        extractNestedBlocks(
            topLevelBlock.tree.root,
            topLevelBlock.tree.root.block.id,
            allBlocks,
            hierarchyMap
        );
    });

    return { allBlocks, hierarchyMap };
}

/**
 * Recursively extracts nested blocks from a BlockNode
 */
function extractNestedBlocks(
    node: BlockNode, // BlockNode type
    parentId: string,
    allBlocks: EditorBlockInstance[],
    hierarchyMap: Map<string, string | null>
): void {
    // Iterate through all slots in children
    for (const [_slotName, childNodes] of Object.entries(node.children)) {
        const children = childNodes as any[]; // Array of BlockNode

        children.forEach((childNode, index) => {
            const childId = childNode.block.id;

            // Create a BlockTree for this child
            const childTree = {
                maxDepth: 10,
                expandRefs: true,
                root: childNode,
            };

            // Add child block to allBlocks
            allBlocks.push({
                tree: childTree,
                layout: {
                    x: 0,
                    y: index * 2,
                    w: 12,
                    h: 6,
                },
                uiMetadata: {},
            });

            // Add to hierarchy map
            hierarchyMap.set(childId, parentId);

            // Recursively process this child's children
            extractNestedBlocks(childNode, childId, allBlocks, hierarchyMap);
        });
    }
}
