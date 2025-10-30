import { GridStackWidget } from "gridstack";
import { ParsedContent } from "../../interface/render.interface";

export function parseContent(meta: GridStackWidget): ParsedContent | null {
    if (!meta.content) return null;
    try {
        const payload = JSON.parse(meta.content);

        // New structure: { blockId, blockTypeKey, renderStructure }
        if (payload && payload.blockId) {
            return {
                type: payload.blockTypeKey || "unknown",
                blockId: payload.blockId,
                renderStructure: payload.renderStructure,
                props: payload.props,
            };
        }

        // Legacy structure: { type, props }
        if (payload && typeof payload.type === "string") {
            return {
                type: payload.type,
                blockId: payload.blockId,
                props: payload.props ?? payload
            };
        }
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("[RenderElementProvider] Failed to parse widget content", error);
        }
    }
    return null;
}
