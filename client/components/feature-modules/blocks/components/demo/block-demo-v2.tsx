/**
 * Block Demo V2
 *
 * Refactored demo using the proper BlockTree architecture with EditorEnvironment.
 * This replaces the old PlaygroundBlock-based approach with the real data model.
 */
"use client";

import { GridContainerProvider } from "@/components/feature-modules/grid/provider/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/grid/provider/grid-provider";
import { RenderElementProvider } from "@/components/feature-modules/render/provider/render-element-provider";
import { Button } from "@/components/ui/button";
import type { GridStackOptions, GridStackWidget } from "gridstack";
import "gridstack/dist/gridstack.css";
import { PlusIcon } from "lucide-react";
import React, { useCallback, useEffect, useMemo } from "react";
import {
    EditorEnvironmentProvider,
    useEditorEnvironment,
} from "../../context/editor-environment-provider";
import { EditorLayoutProvider, useEditorLayout } from "../../context/editor-layout-provider";
import { EditorLayoutRect } from "../../interface/editor.interface";
import { BlockTreeAdapter } from "../../util/block-tree.adapter";
import { editorPanelRegistry } from "../panel/editor-panel";
import {
    createContactBlockTree,
    createInitialDemoBlocks,
    createInvoiceSummaryBlockTree,
    createNoteBlockTree,
    createProjectMetricsBlockTree,
} from "./block-factories";

/**
 * Main [demo] component - sets up the editor environment
 */
export const BlockDemoV2: React.FC = () => {
    // Initialize with demo blocks
    const initialBlocks = useMemo(() => createInitialDemoBlocks(), []);

    return (
        <EditorLayoutProvider>
            <EditorEnvironmentProvider
                organisationId="org-demo"
                initialEnvironment={{
                    id: "demo-env",
                    organisationId: "org-demo",
                    blocks: initialBlocks,
                    metadata: {
                        name: "Block Playground",
                        description: "Demo environment for testing block layouts",
                        createdAt: new Date().toISOString(),
                    },
                }}
            >
                <div className="mx-auto max-w-6xl space-y-8 p-6">
                    <header className="space-y-2">
                        <h1 className="text-2xl font-semibold">Block Environment Editor</h1>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            Drag, resize, and nest blocks using the BlockTree architecture. This
                            demo uses the real data model with proper hierarchy tracking.
                        </p>
                    </header>

                    <AddBlockToolbar />
                    <EditorWorkspace />
                </div>
            </EditorEnvironmentProvider>
        </EditorLayoutProvider>
    );
};

/**
 * Main workspace that renders the editor grid
 */
const EditorWorkspace: React.FC = () => {
    const { getAllBlocks } = useEditorEnvironment();
    const blocks = getAllBlocks();

    const gridOptions = useMemo<GridStackOptions>(() => {
        return BlockTreeAdapter.toGridStackOptions(blocks, {
            cols: 12,
            rowHeight: 60,
            margin: 12,
        });
    }, [blocks]);

    return (
        <GridProvider initialOptions={gridOptions}>
            <EditorGridSync />
            <EditorBlockSync />
            <GridContainerProvider>
                <RenderElementProvider registry={editorPanelRegistry} />
            </GridContainerProvider>
        </GridProvider>
    );
};

/**
 * Syncs blocks from EditorEnvironment to GridStack
 */
const EditorBlockSync: React.FC = () => {
    const { gridStack } = useGrid();
    const { getAllBlocks } = useEditorEnvironment();
    const { getParent } = useEditorLayout();

    useEffect(() => {
        if (!gridStack) return;

        const allBlocks = getAllBlocks();

        // Only add top-level blocks (blocks without a parent) to the root GridStack
        // Nested blocks will be rendered inside their parent's nested content area
        const topLevelBlocks = allBlocks.filter((block) => {
            const parentId = getParent(block.tree.root.block.id);
            return parentId === null;
        });

        const currentWidgetIds = new Set(
            gridStack
                .getGridItems()
                .map((el) => el.getAttribute("gs-id"))
                .filter(Boolean)
        );
        const topLevelBlockIds = new Set(topLevelBlocks.map((b) => b.tree.root.block.id));

        console.log("[EditorBlockSync] Sync triggered", {
            totalBlocks: allBlocks.length,
            topLevelBlocks: topLevelBlocks.length,
            currentWidgets: currentWidgetIds.size,
            topLevelBlockIds: Array.from(topLevelBlockIds),
            currentWidgetIds: Array.from(currentWidgetIds),
        });

        // Add new top-level blocks OR update existing ones that moved
        topLevelBlocks.forEach((block) => {
            const blockId = block.tree.root.block.id;
            if (!currentWidgetIds.has(blockId)) {
                console.log("[EditorBlockSync] Adding widget for block:", blockId);
                const widget = BlockTreeAdapter.toGridStackWidget(block);
                gridStack.addWidget(widget);
            } else {
                // Widget already exists in grid - this can happen when a block is moved
                // from nested to top-level. Ensure it's properly positioned.
                console.log("[EditorBlockSync] Widget already exists:", blockId);
                const element = gridStack.el?.querySelector(`[gs-id="${blockId}"]`);
                if (element) {
                    // Update widget to match the block's layout
                    gridStack.update(element as HTMLElement, {
                        x: block.layout.x,
                        y: block.layout.y,
                        w: block.layout.w,
                        h: block.layout.h,
                    });
                }
            }
        });

        // Remove deleted blocks (or blocks that are no longer top-level)
        currentWidgetIds.forEach((widgetId) => {
            if (widgetId && !topLevelBlockIds.has(widgetId)) {
                console.log("[EditorBlockSync] Removing widget:", widgetId);
                const element = gridStack.el?.querySelector(`[gs-id="${widgetId}"]`);
                if (element) {
                    gridStack.removeWidget(element as HTMLElement, false);
                }
            }
        });
    }, [gridStack, getAllBlocks, getParent]);

    return null;
};

/**
 * Syncs GridStack layout changes back to the EditorEnvironment
 */
const EditorGridSync: React.FC = () => {
    const { gridStack } = useGrid();
    const { updateLayout, getAllBlocks } = useEditorEnvironment();

    useEffect(() => {
        if (!gridStack) return;

        const handleChange = () => {
            const widgets = gridStack.engine.nodes;
            const blocks = getAllBlocks();

            widgets.forEach((widget: GridStackWidget) => {
                if (!widget.id) return;

                const block = blocks.find((b) => b.tree.root.block.id === widget.id);
                // if (!block) return;

                const currentLayout = block.layout;
                const newLayout: EditorLayoutRect = {
                    x: widget.x ?? currentLayout.x,
                    y: widget.y ?? currentLayout.y,
                    w: widget.w ?? currentLayout.w,
                    h: widget.h ?? currentLayout.h,
                };

                // Only update if layout actually changed
                if (
                    newLayout.x !== currentLayout.x ||
                    newLayout.y !== currentLayout.y ||
                    newLayout.w !== currentLayout.w ||
                    newLayout.h !== currentLayout.h
                ) {
                    updateLayout(widget.id, newLayout);
                }
            });
        };

        gridStack.on("change", handleChange);

        return () => {
            gridStack.off("change", handleChange);
        };
    }, [gridStack, updateLayout, getAllBlocks]);

    return null;
};

/**
 * Toolbar for adding new blocks
 */
const AddBlockToolbar: React.FC = () => {
    const { addBlock } = useEditorEnvironment();

    const handleAddContact = useCallback(() => {
        const tree = createContactBlockTree();
        addBlock(tree);
    }, [addBlock]);

    const handleAddProject = useCallback(() => {
        const tree = createProjectMetricsBlockTree();
        addBlock(tree);
    }, [addBlock]);

    const handleAddInvoice = useCallback(() => {
        const tree = createInvoiceSummaryBlockTree();
        addBlock(tree);
    }, [addBlock]);

    const handleAddNote = useCallback(() => {
        const tree = createNoteBlockTree();
        addBlock(tree);
    }, [addBlock]);

    return (
        <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-4">
            <Button onClick={handleAddContact} variant="outline" size="sm">
                <PlusIcon className="mr-2 size-4" />
                Add Contact
            </Button>
            <Button onClick={handleAddProject} variant="outline" size="sm">
                <PlusIcon className="mr-2 size-4" />
                Add Project
            </Button>
            <Button onClick={handleAddInvoice} variant="outline" size="sm">
                <PlusIcon className="mr-2 size-4" />
                Add Invoice
            </Button>
            <Button onClick={handleAddNote} variant="outline" size="sm">
                <PlusIcon className="mr-2 size-4" />
                Add Note
            </Button>
        </div>
    );
};
