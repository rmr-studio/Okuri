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

/**
 * Extracts component `name` and `props` from a widget's JSON `content`, capturing any parse error.
 *
 * Parses `meta.content` (if present) as JSON with shape `{ name: string; props: object }`.
 * On success returns the parsed `name` and `props`; on failure returns empty `name`/`props` and sets `error` to the thrown value.
 *
 * @param meta - GridStack widget metadata (expected to contain a JSON `content` string).
 * @returns An object with `name`, `props`, and `error` (null when parsing succeeded).
 */
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

/**
 * Renders dynamic widget components into their GridStack DOM containers using React portals.
 *
 * For each entry in the grid's internal `_rawWidgetMetaMap`, this provider:
 * - parses the widget metadata to determine a component `name` and `props`,
 * - looks up the component in `componentMap`,
 * - obtains the DOM container for the widget via the grid container API,
 * - if both component and container exist, mounts the component into the container using `createPortal`
 *   and wraps it with `GridStackWidgetContext.Provider` that supplies the widget `id`.
 *
 * Entries with missing components or containers are skipped. Widget metadata parsing errors are
 * captured by `parseWeightMetaToComponentData` (they do not throw here).
 *
 * @param props.componentMap - Mapping from widget names to React component constructors used to resolve and render widgets.
 * @returns A fragment containing portals that mount resolved widget components into their external DOM containers.
 */
export function WidgetRenderProvider(props: { componentMap: ComponentMap }) {
    const { _rawWidgetMetaMap } = useGrid();
    const { getWidgetContainer } = useContainer();

    return (
        <>
            {Array.from(_rawWidgetMetaMap.value.entries()).map(([id, meta]) => {
                const componentData = parseWeightMetaToComponentData(meta);
                const WidgetComponent = props.componentMap[componentData.name];
                const widgetContainer = getWidgetContainer(id);

                if (!WidgetComponent || !widgetContainer) return null;

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

/**
 * Returns the current widget context (contains the widget id) from React context.
 *
 * Throws if called outside the widget provider.
 *
 * @returns The non-null widget context: `{ widget: { id: string } }`.
 * @throws Error if the hook is used outside a GridStackWidgetProvider
 */
export function useWidget() {
    const context = useContext(GridStackWidgetContext);
    if (!context) {
        throw new Error("useWidget must be used within a GridStackWidgetProvider");
    }
    return context;
}
