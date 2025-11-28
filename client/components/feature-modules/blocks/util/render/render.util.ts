import { WidgetRenderStructure } from "@/components/feature-modules/blocks/interface/block.interface";
import { NodeType, RenderType } from "@/lib/types/types";
import { GridStackWidget } from "gridstack";

export function parseContent(widget: GridStackWidget): WidgetRenderStructure | null {
    try {
        if (!widget.content) return null;

        // widget.content is already a JSON string, so we only need to parse once
        const payload =
            typeof widget.content === "string" ? JSON.parse(widget.content) : widget.content;

        if (!payload) return null;
        return {
            id: payload["id"],
            key: payload["key"],
            renderType: payload["renderType"] ?? RenderType.COMPONENT,
            blockType: payload["blockType"] ?? NodeType.CONTENT,
        };
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("[RenderElementProvider] Failed to parse widget content", error);
        }
    }
    return null;
}
