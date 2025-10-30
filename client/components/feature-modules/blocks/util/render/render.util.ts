import { GridStackWidget } from "gridstack";
import { ParsedContent } from "../../interface/render.interface";

export function parseContent(meta: GridStackWidget): ParsedContent | null {
    if (!meta.content) return null;
    try {
        const payload = JSON.parse(meta.content);
        if (payload && typeof payload.type === "string") {
            return { type: payload.type, props: payload.props ?? payload };
        }
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("[RenderElementProvider] Failed to parse widget content", error);
        }
    }
    return null;
}
