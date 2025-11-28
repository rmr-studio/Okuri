import { ChildNodeProps } from "@/lib/interfaces/interface";
import { GridStackWidget } from "gridstack";
import { ReactNode } from "react";
import { WidgetRenderStructure } from "./block.interface";

export interface ProviderProps {
    onUnknownType?: (args: CallbackProvider) => void;
    wrapElement?: (args: WrapElementProvider) => ReactNode;
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
