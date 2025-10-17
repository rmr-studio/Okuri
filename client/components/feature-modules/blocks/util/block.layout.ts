import {
    BlockRenderStructure,
    BlockComponentNode,
} from "@/components/feature-modules/blocks/interface/block.interface";
import type { GridStackWidget } from "gridstack";

interface SavedWidget extends GridStackWidget {
    subGrid?: {
        children?: SavedWidget[];
    };
}

interface ParsedContent {
    type: string;
    componentId?: string;
    slot?: string;
    parentId?: string;
    props?: Record<string, unknown>;
}

interface SlotAccumulator {
    slots: Record<string, string[]>;
    slotLayout: Record<
        string,
        {
            grid?: {
                cols?: number;
                rowHeight?: number;
                margin?: number;
            };
            items: Array<{
                id: string;
                sm?: BlockRenderStructure["layoutGrid"]["items"][number]["lg"];
                md?: BlockRenderStructure["layoutGrid"]["items"][number]["lg"];
                lg?: BlockRenderStructure["layoutGrid"]["items"][number]["lg"];
            }>;
        }
    >;
}

export function buildDisplayFromGridState(
    widgets: GridStackWidget[],
    previous: BlockRenderStructure
): BlockRenderStructure {
    const layoutItems: BlockRenderStructure["layoutGrid"]["items"] = [];
    const components: BlockRenderStructure["components"] = JSON.parse(
        JSON.stringify(previous.components)
    );

    const slotAccumulators = new Map<string, SlotAccumulator>();

    for (const [componentId, node] of Object.entries(components)) {
        const hasSlots = node.slots && Object.keys(node.slots).length > 0;
        if (hasSlots) {
            slotAccumulators.set(componentId, {
                slots: Object.fromEntries(
                    Object.keys(node.slots ?? {}).map((slot) => [slot, []])
                ),
                slotLayout: {},
            });
        }
    }

    const processedSlots = new Map<string, SlotAccumulator>();

    const process = (
        list: SavedWidget[],
        parentId?: string,
        slotName?: string,
        subGridConfig?: { cols?: number; rowHeight?: number; margin?: number }
    ) => {
        list.forEach((widget, index) => {
            const payload = parseContent(widget.content);
            const componentId = payload.componentId ?? widget.id;
            const rect = widgetToRect(widget);

            if (!parentId) {
                layoutItems.push({
                    id: componentId,
                    lg: rect,
                });
            } else {
                const parentAccumulator =
                    processedSlots.get(parentId) ??
                    slotAccumulators.get(parentId) ??
                    createSlotAccumulator(parentId, components);

                const slotKey = payload.slot ?? slotName ?? "default";
                ensureSlot(parentAccumulator, slotKey);
                if (subGridConfig) {
                    parentAccumulator.slotLayout[slotKey].grid = subGridConfig;
                }

                parentAccumulator.slots[slotKey].push(componentId);
                parentAccumulator.slotLayout[slotKey].items.push({
                    id: componentId,
                    lg: rect,
                });

                processedSlots.set(parentId, parentAccumulator);
            }

            if (widget.subGrid?.children?.length) {
                const subGridChildren = widget.subGrid.children as SavedWidget[];
                process(subGridChildren, componentId, undefined, {
                    cols: widget.subGrid.column,
                    rowHeight: widget.subGrid.cellHeight,
                    margin: widget.subGrid.margin,
                });
            }
        });
    };

    process(widgets as SavedWidget[]);

    for (const [componentId, accumulator] of [
        ...slotAccumulators.entries(),
        ...processedSlots.entries(),
    ]) {
        const node = components[componentId];
        if (!node) continue;
        const mergedSlots: Record<string, string[]> = {
            ...(node.slots ?? {}),
            ...accumulator.slots,
        };
        node.slots = mergedSlots;
        (node as unknown as { slotLayout?: any }).slotLayout =
            accumulator.slotLayout;
    }

    return {
        ...previous,
        layoutGrid: {
            ...previous.layoutGrid,
            items: layoutItems,
        },
        components,
    };
}

function parseContent(content?: string): ParsedContent {
    if (!content) return { type: "UNKNOWN" };
    try {
        const parsed = JSON.parse(content);
        return parsed;
    } catch {
        return { type: "UNKNOWN" };
    }
}

function widgetToRect(
    widget: GridStackWidget
): BlockRenderStructure["layoutGrid"]["items"][number]["lg"] {
    return {
        x: widget.x ?? 0,
        y: widget.y ?? 0,
        width: widget.w ?? 1,
        height: widget.h ?? 1,
        locked: Boolean(widget.locked),
    };
}

function createSlotAccumulator(
    componentId: string,
    components: Record<string, BlockComponentNode>
): SlotAccumulator {
    const node = components[componentId];
    const slots = Object.fromEntries(
        Object.keys(node?.slots ?? {}).map((slot) => [slot, [] as string[]])
    );
    return {
        slots,
        slotLayout: Object.fromEntries(
            Object.keys(node?.slots ?? {}).map((slot) => [
                slot,
                { items: [] as Array<{ id: string }> },
            ])
        ),
    };
}

function ensureSlot(accumulator: SlotAccumulator, slotKey: string) {
    if (!accumulator.slots[slotKey]) accumulator.slots[slotKey] = [];
    if (!accumulator.slotLayout[slotKey]) {
        accumulator.slotLayout[slotKey] = { items: [] };
    }
}
