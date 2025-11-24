import { ChildNodeProps } from "@/lib/interfaces/interface";
import { GridStackWidget } from "gridstack";
import { ReactNode } from "react";
import { NodeType } from "./block.interface";

export interface ProviderProps {
    onUnknownType?: (args: CallbackProvider) => void;
    wrapElement?: (args: WrapElementProvider) => ReactNode;
}

/**
 * Parsed content node structured derived from GridStackWidget JSON Payload
 */
export interface WidgetRenderStructure {
    // The block ID this widget represents
    id: string;
    // The block type key
    key: string;
    renderType: "component" | "container" | "list";
    blockType: NodeType | "error";
}

export interface CallbackProvider {
    widget: GridStackWidget;
    content: WidgetRenderStructure;
}

export interface WrapElementProvider extends CallbackProvider, ChildNodeProps {}

export type RenderElementContextValue = {
    widget: {
        id: string;
        container: HTMLElement | null;
        requestResize: () => void;
    };
};
