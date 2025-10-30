/**
 * Block rendering entry point.
 *
 * This module wires the declarative block render structure to GridStack and the
 * React block component registry. It also handles client-side mutations (e.g.
 * deletion) so the UI can update instantly while edits are being made.
 */
"use client";

import { GridContainerProvider } from "@/components/feature-modules/blocks/context/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import {
    BlockNode,
    BlockRenderStructure,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { blockRenderRegistry } from "@/components/feature-modules/blocks/util/block/block.registry";
import type { GridStackOptions } from "gridstack";
import "gridstack/dist/gridstack.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ZodTypeAny } from "zod";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { RenderElementProvider } from "../../context/block-renderer-provider";
import { buildDisplayFromGridState } from "../../util/block/block.layout";
import { BlockEnvironmentGridSync } from "../demo/block-demo";
import { createNodeFromSlashItem } from "../panel/editor-panel";
import {
    defaultSlashItems,
    PanelWrapper,
    QuickActionItem,
    SlashMenuItem,
} from "../panel/panel-wrapper";

/**
 * Renders a `BlockRenderStructure` inside a GridStack instance.
 *
 * The component bootstraps GridStack, keeps a mutable copy of the structure so
 * local edits (deletions) can be reflected immediately, and delegates the
 * actual component rendering to `RenderElementProvider`.
 */
export const RenderBlock: React.FC<{
    node: BlockNode;
    display: BlockRenderStructure;
    onLayoutExporter?: (exporter: () => BlockRenderStructure) => void;
    gridOverrides?: Partial<GridStackOptions>;
    parentId: string | null;
}> = ({ node, display, onLayoutExporter, gridOverrides, parentId }) => {
    const [currentDisplay, setCurrentDisplay] = useState<BlockRenderStructure>(display);

    useEffect(() => {
        setCurrentDisplay(display);
    }, [display]);

    const gridOptions = useMemo(
        () => buildGrid(currentDisplay, ctx, gridOverrides),
        [currentDisplay, ctx, gridOverrides]
    );

    return (
        <GridProvider initialOptions={gridOptions}>
            <BlockEnvironmentGridSync parentId={parentId} />
            <LayoutExporterInitializer display={currentDisplay} onReady={onLayoutExporter} />
            <GridContainerProvider>
                <BlockElementsRenderer />
            </GridContainerProvider>
        </GridProvider>
    );
};

/**
 * Renders all GridStack widgets through `RenderElementProvider` with extra
 * chrome. Right-clicking any rendered block opens a context menu that deletes
 * only that specific component.
 */
type WidgetPayload = {
    componentId?: string;
    [key: string]: unknown;
};

const BlockElementsRenderer: React.FC = () => {
    const { getBlock, removeBlock, insertBlock } = useBlockEnvironment();

    const wrapElement = useCallback(
        ({
            id,
            raw,
            element,
            elementMeta,
        }: {
            id: string;
            raw: WidgetPayload | null;
            element: React.ReactNode;
            elementMeta: RenderElementMetadata<ZodTypeAny>;
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

            const quickActions: QuickActionItem[] = [
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

    return <RenderElementProvider registry={blockRenderRegistry} wrapElement={wrapElement} />;
};

function normaliseSlotLayout(
    layout: SlotLayoutDefinition | undefined,
    ids: string[]
): SlotLayoutDefinition {
    if (layout && Array.isArray(layout.items) && layout.items.length > 0) {
        return layout;
    }

    return {
        grid: { cols: 12, rowHeight: 40, margin: 8 },
        items: ids.map((id, index) => ({
            id,
            lg: createDefaultRect(index),
            sm: createDefaultRect(index),
        })),
    };
}

export function useBlockLayoutExporter(display: BlockRenderStructure) {
    const { saveOptions } = useGrid();

    return useMemo(() => {
        return () => {
            const state = saveOptions();
            if (!state || !Array.isArray(state)) return display;
            return buildDisplayFromGridState(state, display);
        };
    }, [saveOptions, display]);
}

const LayoutExporterInitializer: React.FC<{
    display: BlockRenderStructure;
    onReady?: (exporter: () => BlockRenderStructure) => void;
}> = ({ display, onReady }) => {
    const exporter = useBlockLayoutExporter(display);

    useEffect(() => {
        if (onReady) onReady(exporter);
    }, [exporter, onReady]);

    return null;
};
