import { GridStackWidget } from "gridstack";
import { WidgetRenderStructure } from "../../interface/render.interface";
export function parseContent(widget: GridStackWidget): WidgetRenderStructure | null {
    try {
        const content = widget.content;
        if (!content) return null;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        const script = doc.querySelector<HTMLScriptElement>("script[data-block-meta='true']");

        if (!script?.textContent) return null;
        const payload = JSON.parse(script.textContent);
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
