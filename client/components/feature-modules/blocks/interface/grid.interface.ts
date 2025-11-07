import { ChildNodeProps } from "@/lib/interfaces/interface";
import { GridStack, GridStackNode, GridStackOptions, GridStackWidget } from "gridstack";
import { WidgetRenderStructure } from "./render.interface";

// Environment model for GridStack integration
export interface GridEnvironment {
    widgetMetaMap: Map<string, GridStackWidget>;
    addedWidgets: Set<string>;
}
export interface GridProviderProps extends ChildNodeProps {
    initialOptions: GridStackOptions;
}

export interface GridActionResult<T extends GridStackWidget> {
    success: boolean;
    node: T | null;
}

export interface GridstackContextValue {
    initialOptions: GridStackOptions;
    environment: GridEnvironment;
    save: () => GridstackOptions;
    gridStack: GridStack | null;
    setGridStack: React.Dispatch<React.SetStateAction<GridStack | null>>;
    addWidget: (
        widget: GridStackWidget,
        meta: WidgetRenderStructure,
        parent?: GridStackNode
    ) => GridActionResult<GridStackNode>;
    removeWidget: (id: string) => void;
    widgetExists: (id: string) => boolean;
    findWidget: (id: string) => GridActionResult<GridStackNode>;
}
