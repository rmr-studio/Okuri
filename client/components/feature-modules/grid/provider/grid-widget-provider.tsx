import { createPortal } from "react-dom";
import { useGrid } from "./grid-provider";

import { GridStackWidget } from "gridstack";
import { ComponentType } from "react";

export interface ComponentDataType<T = object> {
    name: string;
    props: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentMap = Record<string, ComponentType<any>>;

function parseWeightMetaToComponentData(
    meta: GridStackWidget
): ComponentDataType & { error: unknown } {
    let error = null;
    let name = "";
    let props = {};
    try {
        if (meta.content) {
            const result = JSON.parse(meta.content) as {
                name: string;
                props: object;
            };
            name = result.name;
            props = result.props;
        }
    } catch (e) {
        error = e;
    }
    return {
        name,
        props,
        error,
    };
}

export const GridStackWidgetContext = createContext<{
    widget: {
        id: string;
    };
} | null>(null);

export function WidgetRenderProvider(props: { componentMap: ComponentMap }) {
    const { _rawWidgetMetaMap } = useGrid();
    const { getWidgetContainer } = useContainer();

    return (
        <>
            {Array.from(_rawWidgetMetaMap.value.entries()).map(([id, meta]) => {
                const componentData = parseWeightMetaToComponentData(meta);

                const WidgetComponent = props.componentMap[componentData.name];

                const widgetContainer = getWidgetContainer(id);

                if (!widgetContainer) {
                    throw new Error(`Widget container not found for id: ${id}`);
                }

                return (
                    <GridStackWidgetContext.Provider key={id} value={{ widget: { id } }}>
                        {createPortal(
                            <WidgetComponent {...componentData.props} />,
                            widgetContainer
                        )}
                    </GridStackWidgetContext.Provider>
                );
            })}
        </>
    );
}

import { createContext, useContext } from "react";
import { useContainer } from "./grid-container-provider";

export function useWidget() {
    const context = useContext(GridStackWidgetContext);
    if (!context) {
        throw new Error("useWidget must be used within a GridStackWidgetProvider");
    }
    return context;
}
