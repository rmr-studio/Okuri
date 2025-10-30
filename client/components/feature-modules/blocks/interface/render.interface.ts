import { GridStackWidget } from "gridstack";
import { ReactNode } from "react";
import { RenderElementMetadata } from "../util/block/block.registry";
import { ComponentType } from "./block.interface";

export interface ProviderProps {
    transformProps?: (args: {
        id: string;
        meta: GridStackWidget;
        element: RenderElementMetadata<any>;
        parsedProps: unknown;
        raw: ParsedContent | null;
    }) => unknown;
    onUnknownType?: (info: { id: string; raw: ParsedContent | null }) => void;
    wrapElement?: (args: {
        id: string;
        meta: GridStackWidget;
        element: ReactNode;
        elementMeta: RenderElementMetadata<any>;
        parsedProps: unknown;
        raw: ParsedContent | null;
    }) => ReactNode;
}

export interface ParsedContent {
    type: ComponentType | string;
    props?: unknown;
    componentId?: string;
    slot?: string;
    parentId?: string;
    blockId?: string;
    renderStructure?: any; // BlockRenderStructure
}
