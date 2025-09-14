"use client";

import type { GridStackWidget } from "gridstack";
import { ComponentType, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { WidgetRegistry, WidgetType } from "../util/registry";
import { useContainer } from "./grid-container-provider";
import { useGrid } from "./grid-provider";

export interface ComponentDataType<T = Record<string, unknown>> {
    type: WidgetType;
    props: T;
}

/**
 * Extracts widget `type` and `props` from a widget's JSON `content`, capturing any parse error.
 *
 * Parses `meta.content` (if present) as JSON with shape matching your widget schema.
 * On success returns the parsed `type` and `props`; on failure returns default values and sets `error`.
 *
 * @param meta - GridStack widget metadata (expected to contain a JSON `content` string).
 * @returns An object with `type`, `props`, and `error` (null when parsing succeeded).
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

/**
 * Renders dynamic widget components into their GridStack DOM containers using React portals.
 *
 * For each entry in the grid's internal `_rawWidgetMetaMap`, this provider:
 * - parses the widget metadata to determine a component `type` and `props`,
 * - looks up the component in the widget registry,
 * - obtains the DOM container for the widget via the grid container API,
 * - if both component and container exist, mounts the component into the container using `createPortal`
 *   and wraps it with `GridStackWidgetContext.Provider` that supplies the widget `id`.
 *
 * @param props.componentMap - Widget registry mapping from widget types to widget metadata
 * @returns A fragment containing portals that mount resolved widget components into their external DOM containers.
 */
export function WidgetRenderProvider(props: { componentMap: WidgetRegistry }) {
    const { _rawWidgetMetaMap } = useGrid();
    const { getWidgetContainer } = useContainer();

    return (
        <>
            {Array.from(_rawWidgetMetaMap.value.entries()).map(([id, meta]) => {
                const componentData = parseWidgetMetaToComponentData(meta);
                const widgetMeta = props.componentMap[componentData.type];
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

                // Extract the actual component from the widget metadata
                const WidgetComponent = widgetMeta.component as ComponentType<
                    typeof validatedProps
                >;

                // Validate props against widget schema
                let validatedProps: any;
                try {
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

                return (
                    <GridStackWidgetContext.Provider key={id} value={{ widget: { id } }}>
                        {createPortal(<WidgetComponent {...validatedProps} />, widgetContainer)}
                    </GridStackWidgetContext.Provider>
                );
            })}
        </>
    );
}

/**
 * Returns the current widget context (contains the widget id) from React context.
 *
 * Throws if called outside the widget provider.
 *
 * @returns The non-null widget context: `{ widget: { id: string } }`.
 * @throws Error if the hook is used outside a WidgetRenderProvider
 */
export function useWidget() {
    const context = useContext(GridStackWidgetContext);
    if (!context) {
        throw new Error("useWidget must be used within a WidgetRenderProvider");
    }
    return context;
}
