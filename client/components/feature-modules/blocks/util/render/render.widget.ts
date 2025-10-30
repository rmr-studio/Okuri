/**
 * Produces a `GridStackWidget` for a single component id. This involves
 * resolving bindings, running schema validation, and preparing fallback widgets
 * for missing/invalid nodes.
 */
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
    // TODO Conditional Rendering of layouts
    // if (!evalVisible(node.visible, ctx)) return null;

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

    // Map JSON payload + references into concrete component props.
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
