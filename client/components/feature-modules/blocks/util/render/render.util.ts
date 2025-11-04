import { GridStackWidget } from "gridstack";
import { WidgetRenderStructure } from "../../interface/render.interface";
export function parseContent(widget: GridStackWidget): WidgetRenderStructure | null {
    try {
        if (!widget.content) return null;
        const payload = JSON.parse(widget.content);
        if (!payload) return null;
        return {
            id: payload["id"],
            key: payload["key"],
            renderType: payload["renderType"] ?? "component",
            blockType: payload["blockType"] ?? "block",
        };
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("[RenderElementProvider] Failed to parse widget content", error);
        }
    }
    return null;
}
