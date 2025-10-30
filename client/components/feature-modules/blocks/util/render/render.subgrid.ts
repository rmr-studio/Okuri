import { ContentNode } from "../../interface/block.interface";

/**
 * Builds the GridStack configuration for a component that hosts slots (i.e.
 * nested blocks). Each slot can optionally describe its own grid overrides and
 * layout items.
 */
function buildSubGrid(node: ContentNode, parentPath: string): GridStackOptions | null {
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

        // If the layout definition didn’t mention an id, we still include a
        // sensible default so nothing disappears on load.
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
        // sizeToContent: true,
        margin: margin ?? 8,
        acceptWidgets: true,
        animate: true,
        children,
    };
}
