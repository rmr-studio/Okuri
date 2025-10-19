"use client";

import {
    BlockReference,
    BlockRenderStructure,
    BlockTree,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { applyBindings } from "@/components/feature-modules/blocks/util/block.binding";
import { buildDisplayFromGridState } from "@/components/feature-modules/blocks/util/block.layout";
import { blockRenderRegistry } from "@/components/feature-modules/blocks/util/block.registry";
import { evalVisible } from "@/components/feature-modules/blocks/util/block.visibility";
import { GridContainerProvider } from "@/components/feature-modules/grid/provider/grid-container-provider";
import { GridProvider, useGrid } from "@/components/feature-modules/grid/provider/grid-provider";
import { RenderElementProvider } from "@/components/feature-modules/render/provider/render-element-provider";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { GridStackOptions, GridStackWidget } from "gridstack";
import "gridstack/dist/gridstack.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export interface TreeCtx {
    payload: object;
    references: Record<string, BlockReference[]>;
}

export const RenderBlock: React.FC<{
    tree: BlockTree;
    display: BlockRenderStructure;
    onLayoutExporter?: (exporter: () => BlockRenderStructure) => void;
    gridOverrides?: Partial<GridStackOptions>;
}> = ({ tree, display, onLayoutExporter, gridOverrides }) => {
    const [currentDisplay, setCurrentDisplay] = useState<BlockRenderStructure>(display);
    const ctx = useMemo<TreeCtx>(
        () => ({
            payload: tree.root.block.payload.data,
            references: tree.root.references ?? {},
        }),
        [tree]
    );

    useEffect(() => {
        setCurrentDisplay(display);
    }, [display]);

    const gridOptions = useMemo(
        () => buildGridOptions(currentDisplay, ctx, gridOverrides),
        [currentDisplay, ctx, gridOverrides]
    );

    const handleComponentDelete = useCallback((componentId: string) => {
        setCurrentDisplay((prev) => removeComponentFromDisplay(prev, componentId));
    }, []);

    return (
        <GridProvider initialOptions={gridOptions}>
            <LayoutExporterInitializer display={currentDisplay} onReady={onLayoutExporter} />
            <GridContainerProvider>
                <BlockElementsRenderer onDeleteComponent={handleComponentDelete} />
            </GridContainerProvider>
        </GridProvider>
    );
};

const BlockElementsRenderer: React.FC<{
    onDeleteComponent: (componentId: string) => void;
}> = ({ onDeleteComponent }) => {
    const { removeWidget } = useGrid();

    const wrapElement = useCallback(
        ({ id, raw, element }: { id: string; raw: any; element: React.ReactNode }) => {
            const componentId = raw?.componentId ?? id;
            const handleDelete = () => {
                removeWidget(id);
                onDeleteComponent(componentId);
            };
            return (
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <div className="h-full w-full">{element}</div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="min-w-[10rem]">
                        <ContextMenuItem variant="destructive" onSelect={handleDelete}>
                            Delete block
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            );
        },
        [removeWidget, onDeleteComponent]
    );

    return <RenderElementProvider registry={blockRenderRegistry} wrapElement={wrapElement} />;
};

interface LayoutRect {
    x: number;
    y: number;
    width: number;
    height: number;
    locked?: boolean;
}

interface SlotLayoutDefinition {
    grid?: {
        cols?: number;
        rowHeight?: number;
        margin?: number;
    };
    items: Array<{
        id: string;
        sm?: LayoutRect;
        md?: LayoutRect;
        lg?: LayoutRect;
    }>;
}

function buildGridOptions(
    display: BlockRenderStructure,
    ctx: TreeCtx,
    overrides?: Partial<GridStackOptions>
): GridStackOptions {
    const children: GridStackWidget[] = [];

    for (const item of display.layoutGrid.items ?? []) {
        const rect = pickRect(item);
        const widget = buildWidgetForComponent({
            componentId: item.id,
            rect,
            display,
            ctx,
            path: item.id,
        });
        if (widget) children.push(widget);
    }

    return {
        column: display.layoutGrid.cols ?? 12,
        cellHeight: display.layoutGrid.rowHeight ?? 40,
        margin: 8,
        acceptWidgets: true,
        animate: true,
        ...overrides,
        children,
    };
}

function buildWidgetForComponent({
    componentId,
    rect,
    display,
    ctx,
    path,
    slot,
    parentId,
}: {
    componentId: string;
    rect: LayoutRect;
    display: BlockRenderStructure;
    ctx: TreeCtx;
    path: string;
    slot?: string;
    parentId?: string;
}): GridStackWidget | null {
    const node = display.components[componentId];
    const widgetId = path;

    if (!node) {
        return createWidget(widgetId, rect, {
            type: "FALLBACK",
            props: { reason: `Component "${componentId}" not found` },
            componentId,
            slot,
            parentId,
        });
    }

    if (!evalVisible(node.visible, ctx)) return null;

    const elementMeta = blockRenderRegistry[node.type];
    if (!elementMeta) {
        return createWidget(widgetId, rect, {
            type: "FALLBACK",
            props: { reason: `No renderer registered for type "${node.type}"` },
            componentId,
            slot,
            parentId,
        });
    }

    const boundProps = applyBindings(node, ctx) as Record<string, unknown>;

    let parsedProps: Record<string, unknown>;
    try {
        parsedProps = elementMeta.schema.parse(boundProps) as Record<string, unknown>;
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error(
                `[RenderBlock] Prop validation failed for ${node.type} (${componentId}).`,
                error
            );
        }
        return createWidget(widgetId, rect, {
            type: "FALLBACK",
            props: { reason: `Invalid props for component "${node.type}"` },
            componentId,
            slot,
            parentId,
        });
    }

    const widget = createWidget(widgetId, rect, {
        type: node.type,
        props: parsedProps,
        componentId,
        slot,
        parentId,
    });

    const subGrid = buildSubGrid(node, display, ctx, widgetId);
    if (subGrid) {
        widget.subGridOpts = {
            acceptWidgets: true,
            animate: true,
            class: "grid-stack-subgrid",
            ...subGrid,
        };
    }

    return widget;
}

function buildSubGrid(
    node: BlockRenderStructure["components"][string],
    display: BlockRenderStructure,
    ctx: TreeCtx,
    parentPath: string
): GridStackOptions | null {
    const slots: Record<string, string[]> = node.slots ?? {};
    if (Object.keys(slots).length === 0) return null;

    const slotLayout =
        (node as unknown as { slotLayout?: Record<string, SlotLayoutDefinition> }).slotLayout ?? {};

    const children: GridStackWidget[] = [];
    let column: number | undefined;
    let cellHeight: number | undefined;
    let margin: number | undefined;

    for (const [slotName, ids] of Object.entries(slots)) {
        if (!Array.isArray(ids) || ids.length === 0) continue;

        const layoutDefinition = normaliseSlotLayout(slotLayout[slotName], ids);
        const gridConfig = layoutDefinition.grid ?? {};

        if (gridConfig.cols != null) column = gridConfig.cols;
        if (gridConfig.rowHeight != null) cellHeight = gridConfig.rowHeight;
        if (gridConfig.margin != null) margin = gridConfig.margin;

        const definedIds = new Set(layoutDefinition.items.map((item) => item.id));

        for (const layoutItem of layoutDefinition.items) {
            if (!ids.includes(layoutItem.id)) continue;
            const rect = pickRect(layoutItem);
            const childWidget = buildWidgetForComponent({
                componentId: layoutItem.id,
                rect,
                display,
                ctx,
                path: `${parentPath}::${layoutItem.id}`,
                slot: slotName,
                parentId: node.id,
            });
            if (childWidget) children.push(childWidget);
        }

        ids.forEach((id, index) => {
            if (definedIds.has(id)) return;
            const fallbackRect = createDefaultRect(index);
            const childWidget = buildWidgetForComponent({
                componentId: id,
                rect: fallbackRect,
                display,
                ctx,
                path: `${parentPath}::${id}`,
                slot: slotName,
                parentId: node.id,
            });
            if (childWidget) children.push(childWidget);
        });
    }

    if (children.length === 0) return null;

    return {
        column: column ?? 12,
        cellHeight: cellHeight ?? 40,
        margin: margin ?? 8,
        acceptWidgets: true,
        animate: true,
        children,
    };
}

function cloneDisplay(display: BlockRenderStructure): BlockRenderStructure {
    return JSON.parse(JSON.stringify(display)) as BlockRenderStructure;
}

function collectDescendants(
    components: Record<string, BlockRenderStructure["components"][string]>,
    componentId: string,
    acc: Set<string>
) {
    if (acc.has(componentId)) return;
    acc.add(componentId);
    const node = components[componentId];
    if (!node || !node.slots) return;
    for (const ids of Object.values(node.slots)) {
        ids.forEach((id) => collectDescendants(components, id, acc));
    }
}

function removeComponentFromDisplay(
    display: BlockRenderStructure,
    componentId: string
): BlockRenderStructure {
    if (!display.components?.[componentId]) return display;
    const clone = cloneDisplay(display);

    const idsToRemove = new Set<string>();
    collectDescendants(clone.components, componentId, idsToRemove);

    for (const id of idsToRemove) {
        delete clone.components[id];
    }

    clone.layoutGrid = {
        ...clone.layoutGrid,
        items: (clone.layoutGrid.items ?? []).filter((item) => !idsToRemove.has(item.id)),
    };

    for (const node of Object.values(clone.components)) {
        if (!node?.slots) continue;
        let updated = false;
        const nextSlots: Record<string, string[]> = {};
        for (const [slotName, ids] of Object.entries(node.slots)) {
            const filtered = ids.filter((id) => !idsToRemove.has(id));
            nextSlots[slotName] = filtered;
            if (filtered.length !== ids.length) {
                updated = true;
            }
            const slotLayout = (
                node as unknown as { slotLayout?: Record<string, SlotLayoutDefinition> }
            ).slotLayout;
            if (slotLayout?.[slotName]) {
                slotLayout[slotName].items = slotLayout[slotName].items.filter(
                    (item) => !idsToRemove.has(item.id)
                );
            }
        }
        if (updated) {
            node.slots = nextSlots;
        }
    }

    return clone;
}

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

function createWidget(
    id: string,
    rect: LayoutRect,
    payload: {
        type: string;
        props?: Record<string, unknown>;
        componentId?: string;
        slot?: string;
        parentId?: string;
    }
): GridStackWidget {
    const w = rect?.width ?? 12;
    const h = rect?.height ?? 4;
    const x = rect?.x ?? 0;
    const y = rect?.y ?? 0;
    const locked = rect?.locked ?? false;

    return {
        id,
        w,
        h,
        x,
        y,
        locked,
        noMove: locked,
        noResize: locked,
        content: JSON.stringify(payload),
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

function pickRect(
    item: { sm?: LayoutRect; md?: LayoutRect; lg?: LayoutRect } | undefined
): LayoutRect {
    return item?.lg ?? item?.md ?? item?.sm ?? createDefaultRect(0);
}

function createDefaultRect(index: number): LayoutRect {
    return {
        x: 0,
        y: index * 4,
        width: 12,
        height: 4,
        locked: false,
    };
}
