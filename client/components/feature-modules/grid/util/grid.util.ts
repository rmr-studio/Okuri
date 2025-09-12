import { GridStackOptions, GridStackWidget } from "gridstack";
import { WidgetConfig } from "./registry";

export const createWidgetFromConfig = (config: WidgetConfig): GridStackWidget => ({
    id: config.id,
    x: config.gridProps?.x,
    y: config.gridProps?.y,
    w: config.gridProps?.w || 1,
    h: config.gridProps?.h || 1,
    content: `widget-${config.id}`, // This will be used as a selector for React rendering
});

export const generateUniqueId = (): string => {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const defaultGridOptions: GridStackOptions = {
    cellHeight: 50,
    margin: 5,
    minRow: 2,
    acceptWidgets: true,
    subGridDynamic: true,
    subGridOpts: {
        cellHeight: 50,
        column: "auto",
        acceptWidgets: true,
        margin: 5,
        subGridDynamic: true,
    },
};

export const createNestedGridWidget = (
    id: string,
    subGridOptions?: GridStackOptions,
    gridProps?: { x?: number; y?: number; w?: number; h?: number }
): GridStackWidget => ({
    id,
    x: gridProps?.x,
    y: gridProps?.y,
    w: gridProps?.w || 2,
    h: gridProps?.h || 3,
    subGridOpts: {
        ...defaultGridOptions.subGridOpts,
        ...subGridOptions,
        children: subGridOptions?.children || [],
    },
});
