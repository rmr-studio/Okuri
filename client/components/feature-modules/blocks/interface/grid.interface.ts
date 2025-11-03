import { ChildNodeProps } from "@/lib/interfaces/interface";
import { GridStack, GridStackNode, GridStackOptions, GridStackWidget } from "gridstack";
import { Environment } from "./editor.interface";
import { WidgetRenderStructure } from "./render.interface";

// Environment model for GridStack integration
export interface GridEnvironment extends Environment {
    widgetMetaMap: Map<string, GridStackWidget>;
}
export interface GridProviderProps extends ChildNodeProps {
    initialOptions: GridStackOptions;
    initialWidgetMap?: Map<string, GridStackWidget>;
}

export interface GridActionResult {
    success: boolean;
    node: GridStackNode | null;
}

export interface GridstackContextValue {
    initialOptions: GridStackOptions;
    environment: GridEnvironment;
    gridStack: GridStack | null;
    setGridStack: React.Dispatch<React.SetStateAction<GridStack | null>>;
    addWidget: (
        widget: GridStackWidget,
        meta: WidgetRenderStructure,
        parent?: GridStackNode
    ) => GridActionResult;
    removeWidget: (id: string) => void;
    widgetExists: (id: string) => boolean;
    findWidget: (id: string) => GridActionResult;
}
