"use client";

import type { GridStackWidget } from "gridstack";
import { ComponentType, createContext, FC, useContext } from "react";
import { createPortal } from "react-dom";
import { WidgetRegistry, WidgetType } from "../util/widget.registry";
import { useContainer } from "./grid-container-provider";
import { useGrid } from "./grid-provider";

export interface ComponentDataType<T = Record<string, unknown>> {
    type: WidgetType;
    props: T;
}

/**
 * Extracts widget type and props from a widget's JSON content, capturing any parse error.
 */
const parseWidgetMetaToComponentData = (
    meta: GridStackWidget
): ComponentDataType & { error: unknown } => {
    let error = null;
    let type: WidgetType = "TEXT"; // default fallback
    let props: Record<string, unknown> = {};

    try {
        if (meta.content) {
            const result = JSON.parse(meta.content);

            // Expect the full widget schema structure
            if (result.type && typeof result.type === "string") {
                type = result.type as WidgetType;
                props = result; // Pass the entire widget object as props
            } else {
                error = new Error("Invalid widget meta: 'type' must be a string");
            }
        }
    } catch (e) {
        error = e;
    }

    return {
        type,
        props,
        error,
    };
};

export const GridStackWidgetContext = createContext<{
    widget: {
        id: string;
    };
} | null>(null);

interface Props {
    map: WidgetRegistry;
    onDelete: (id: string) => void;
}

export const WidgetRenderProvider: FC<Props> = ({ map, onDelete }) => {
    const { _rawWidgetMetaMap } = useGrid();
    const { getWidgetContainer } = useContainer();

    return (
        <>
            {Array.from(_rawWidgetMetaMap.value.entries()).map(([id, meta]) => {
                const componentData = parseWidgetMetaToComponentData(meta);
                const widgetMeta = map[componentData.type as keyof WidgetRegistry];
                const widgetContainer = getWidgetContainer(id);

                if (!widgetMeta) {
                    if (process.env.NODE_ENV !== "production") {
                        console.warn(
                            `[WidgetRenderProvider] Unknown widget type "${componentData.type}" for id "${id}".`
                        );
                    }
                    return null;
                }

                if (!widgetContainer) {
                    if (process.env.NODE_ENV !== "production") {
                        console.warn(
                            `[WidgetRenderProvider] Missing container for widget "${id}".`
                        );
                    }
                    return null;
                }

                // FIX: Access the component correctly from the WidgetMetadata structure
                // widgetMeta is the result of createWidget(), which has a .component property
                const WidgetComponent = widgetMeta.component as ComponentType<any>;

                // Validate props against widget schema
                let validatedProps: any;
                try {
                    // FIX: Use the schema from the widget metadata
                    validatedProps = widgetMeta.schema.parse(componentData.props);
                } catch (validationError) {
                    if (process.env.NODE_ENV !== "production") {
                        console.error(
                            `[WidgetRenderProvider] Schema validation failed for widget "${id}" of type "${componentData.type}":`,
                            validationError
                        );
                    }
                    // Use default values from schema
                    try {
                        validatedProps = widgetMeta.schema.parse({
                            id,
                            type: componentData.type,
                            data: {},
                            position: { x: 0, y: 0, width: 1, height: 1 },
                            interactions: {},
                        });
                    } catch {
                        return null; // Skip if even defaults fail
                    }
                }

                // FIX: Pass onDelete prop to the component
                const propsWithDelete = {
                    ...validatedProps,
                    onDelete: () => onDelete(id),
                };

                return (
                    <GridStackWidgetContext.Provider key={id} value={{ widget: { id } }}>
                        {createPortal(<WidgetComponent {...propsWithDelete} />, widgetContainer)}
                    </GridStackWidgetContext.Provider>
                );
            })}
        </>
    );
};

/**
 * Returns the current widget context (contains the widget id) from React context.
 */
export function useWidget() {
    const context = useContext(GridStackWidgetContext);
    if (!context) {
        throw new Error("useWidget must be used within a WidgetRenderProvider");
    }
    return context;
}
