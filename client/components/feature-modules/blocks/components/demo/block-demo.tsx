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
import type { GridStackWidget } from "gridstack";
import "gridstack/dist/gridstack.css";
import { PlusIcon, TypeIcon } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "../../styles/gridstack-custom.css";

import { RenderElementProvider } from "@/components/feature-modules/blocks/context/block-renderer-provider";
import { GridContainerProvider } from "@/components/feature-modules/blocks/context/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/blocks/context/grid-provider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BlockEnvironmentProvider,
    useBlockEnvironment,
} from "../../context/block-environment-provider";
import { useEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";
import { BlockNode, BlockTree, isContentNode } from "../../interface/block.interface";
import { EditorEnvironment } from "../../interface/editor.interface";
import { getCurrentDimensions } from "../../util/block/block.util";
import {
    createContactBlockNode,
    createLayoutContainerNode,
    createNoteNode,
} from "../../util/block/factory/mock.factory";
import { getTreeId } from "../../util/environment/environment.util";
import { buildGridEnvironmentWithWidgetMap } from "../../util/render/render.tree";
import { PanelWrapper, SlashMenuItem, defaultSlashItems } from "../panel/panel-wrapper";

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
    const { getTrees, environment } = useBlockEnvironment();
    const { options, widgetMap } = useMemo(
        () => buildGridEnvironmentWithWidgetMap(getTrees()),
        [getTrees]
    );

    useEffect(() => {
        console.log(environment);
    }, [environment]);

    return (
        <>
            <GridProvider initialOptions={options} initialWidgetMap={widgetMap}>
                <BlockEnvironmentGridSync parentId={null} />
                <GridStackWidgetSync />
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
    const { getBlock, removeBlock, insertBlock } = useBlockEnvironment();

    const wrapElement = useCallback(
        ({
            id,
            raw,
            element,
            elementMeta,
        }: {
            id: string;
            meta: GridStackWidget;
            element: React.ReactNode;
            elementMeta: any;
            parsedProps: unknown;
            raw: { type: string; props?: unknown; blockId?: string; componentId?: string } | null;
        }) => {
            const blockId = String(raw?.blockId ?? raw?.componentId ?? id);
            const blockNode = getBlock(blockId);

            if (!blockNode) {
                return element;
            }

            const canNest = Boolean(blockNode.block.type.nesting);
            const organisationId = blockNode.block.organisationId;

            const handleDelete = () => removeBlock(blockId);
            const handleInsert = (item: SlashMenuItem) => {
                if (!canNest || !organisationId) return;
                const newNode = createNodeFromSlashItem(item, organisationId);
                if (!newNode) return;
                insertBlock(newNode, blockId, "main", null);
            };

            const quickActions = [
                {
                    id: "delete",
                    label: "Delete block",
                    shortcut: "⌘⌫",
                    onSelect: handleDelete,
                },
            ];

            const title =
                blockNode.block.type.name ??
                blockNode.block.name ??
                elementMeta?.name ??
                "Untitled Block";
            const description = blockNode.block.type.description ?? elementMeta?.description;

            return (
                <PanelWrapper
                    id={blockId}
                    title={title}
                    description={description}
                    slashItems={defaultSlashItems}
                    quickActions={quickActions}
                    allowInsert={canNest}
                    onInsert={canNest ? handleInsert : undefined}
                    onDelete={handleDelete}
                >
                    {element}
                </PanelWrapper>
            );
        },
        [getBlock, insertBlock, removeBlock]
    );

    return <RenderElementProvider wrapElement={wrapElement} />;
};

/**
 * Helper to create a block node from a slash menu item
 */
function createNodeFromSlashItem(item: SlashMenuItem, organisationId: string): BlockNode | null {
    switch (item.id) {
        case "CONTACT_CARD":
            return createContactBlockNode(organisationId);
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
 * Synchronizes GridStack widgets when blocks change at any level of the tree.
 *
 * Handles:
 * - Adding new top-level blocks to the main grid
 * - Adding nested blocks to parent subgrids
 * - Removing blocks and their descendants from widget map
 * - Maintaining 1:1 widget-to-block mapping
 */
const GridStackWidgetSync: React.FC = () => {
    const { gridStack, _rawWidgetMetaMap } = useGrid();
    const { getTrees, getParent, environment, isInitialized, setIsInitialized } =
        useBlockEnvironment();

    const trees = useMemo(() => getTrees(), [getTrees]);
    const topLevelBlocks = useMemo(() => trees, [trees]);

    // Track ALL block IDs in the environment (not just top-level)
    const allBlockIds = useMemo(() => {
        return new Set(environment.treeIndex.keys());
    }, [environment.treeIndex]);

    // Track previous state
    const prevBlockIdsRef = useRef(new Set<string>());
    const hasInitiallyLoadedRef = useRef(false);

    useLayoutEffect(() => {
        if (!gridStack) return;

        const currentBlockIds = allBlockIds;
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
            // Check if widget already exists in GridStack
            const alreadyInGrid = gridStack.engine.nodes?.some(
                (node) => String(node.id) === blockId
            );
            if (alreadyInGrid) {
                return;
            }

            // Find the block tree containing this block
            const treeId = environment.treeIndex.get(blockId);
            if (!treeId) return;

            const tree = topLevelBlocks.find((t) => getTreeId(t) === treeId);
            if (!tree) return;

            // Find the block node
            const blockNode = findBlockNodeById(tree.root, blockId);
            if (!blockNode) return;

            const layout = blockNode.block.layout ?? getCurrentDimensions(blockNode);
            const parentId = getParent(blockId);

            const widgetConfig = {
                id: blockId,
                x: layout.x,
                y: layout.y,
                w: layout.width,
                h: layout.height,
                content: JSON.stringify({
                    type: blockNode.block.type.key,
                    blockId: blockId,
                }),
            };

            if (!parentId) {
                // Top-level block - add to main grid
                console.log(`Adding top-level widget ${blockId} to GridStack`);
                gridStack.addWidget(widgetConfig);
            } else {
                // Nested block - add to parent's subgrid
                console.log(`Adding nested widget ${blockId} to parent ${parentId} subgrid`);
                const parentNode = gridStack.engine.nodes?.find((n) => String(n.id) === parentId);
                const parentSubGrid = parentNode?.subGrid;
                if (parentSubGrid) {
                    parentSubGrid.addWidget(widgetConfig);
                } else {
                    console.warn(
                        `Parent ${parentId} has no subgrid for child ${blockId}. Widget not added.`
                    );
                    return;
                }
            }

            // Update rawWidgetMetaMap so RenderElementProvider can find it
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

            // Remove from rawWidgetMetaMap (descendants are handled by GridProvider's removeWidget)
            _rawWidgetMetaMap.set((prev) => {
                const newMap = new Map(prev);
                newMap.delete(blockId);
                return newMap;
            });
        });

        // Update the ref for next render
        prevBlockIdsRef.current = new Set(currentBlockIds);

        // Mark as initialized after the first load completes
        if (!hasInitiallyLoadedRef.current && !isInitialized) {
            hasInitiallyLoadedRef.current = true;
            setIsInitialized(true);
            console.log(
                "[GridStackWidgetSync] Initial grid load complete, environment initialized"
            );
        }
    }, [gridStack, allBlockIds, topLevelBlocks, environment, getParent, _rawWidgetMetaMap]);

    return null;
};

/**
 * Helper to find a block node by ID within a tree (DFS)
 */
function findBlockNodeById(node: BlockNode, blockId: string): BlockNode | undefined {
    if (node.block.id === blockId) {
        return node;
    }

    if (isContentNode(node) && node.children) {
        for (const slotChildren of Object.values(node.children)) {
            for (const child of slotChildren) {
                const found = findBlockNodeById(child, blockId);
                if (found) return found;
            }
        }
    }

    return undefined;
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

// Note: buildGridEnvironment has been replaced by buildGridEnvironmentWithWidgetMap
// from util/render/render.tree.ts which recursively builds widgets for the entire tree

function createDemoTrees(): BlockTree[] {
    // Create a client overview block (demonstrates multi-component block)
    const contactNode = createContactBlockNode(DEMO_ORG_ID);
    const contactTree: BlockTree = {
        type: "block_tree",
        root: contactNode,
    };

    // Create a layout container (demonstrates wildcard slots)
    const layoutNode = createLayoutContainerNode(DEMO_ORG_ID);
    const layoutTree: BlockTree = {
        type: "block_tree",
        root: layoutNode,
    };

    return [contactTree, layoutTree];
}
