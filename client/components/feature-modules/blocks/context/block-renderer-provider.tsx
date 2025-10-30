"use client";

import { ComponentType, createContext, FC, useContext } from "react";
import { createPortal } from "react-dom";
import { ProviderProps } from "../interface/render.interface";
import { blockRenderRegistry } from "../util/block/block.registry";
import { parseContent } from "../util/render/render.util";
import { useContainer } from "./grid-container-provider";
import { useGrid } from "./grid-provider";

export const RenderElementContext = createContext<{ widget: { id: string } } | null>(null);

/**
 * This is a provider that will extract the metadata stored inside a GridStackWidget.
 * Examine the associated metadata/props and will render the appropriate component registered
 *
 * If a component type is unknown, it will resort to displaying a generic fallback component, and
 * will invoke an optionally provided `onUnknownType` callback.
 *
 */
export const RenderElementProvider: FC<ProviderProps> = ({
    transformProps,
    onUnknownType,
    wrapElement,
}) => {
    const { _rawWidgetMetaMap } = useGrid();
    const { getWidgetContainer } = useContainer();

    return (
        <>
            {Array.from(_rawWidgetMetaMap.value.entries()).map(([id, meta]) => {
                const raw = parseContent(meta);
                if (!raw) return null;

                let elementMeta = blockRenderRegistry[raw.type];
                let effectiveRaw = raw;

                if (!elementMeta) {
                    onUnknownType?.({ id, raw });
                    const fallbackMeta = blockRenderRegistry["FALLBACK"];
                    if (!fallbackMeta) {
                        if (process.env.NODE_ENV !== "production") {
                            console.warn(
                                `[RenderElementProvider] Unknown render element type "${raw.type}" for id "${id}".`
                            );
                        }
                        return null;
                    }
                    elementMeta = fallbackMeta;
                    effectiveRaw = {
                        type: "FALLBACK",
                        props: { reason: `Unknown component type "${raw.type}"` },
                    };
                }

                let parsedProps: unknown;
                try {
                    parsedProps = elementMeta.schema.parse(effectiveRaw.props ?? {});
                } catch (error) {
                    const fallbackMeta = registry["FALLBACK"];
                    if (fallbackMeta && elementMeta.type !== "FALLBACK") {
                        elementMeta = fallbackMeta;
                        effectiveRaw = {
                            type: "FALLBACK",
                            props: {
                                reason: `Invalid props for component "${raw.type ?? "unknown"}"`,
                            },
                        };
                        try {
                            parsedProps = fallbackMeta.schema.parse(effectiveRaw.props ?? {});
                        } catch (fallbackError) {
                            if (process.env.NODE_ENV !== "production") {
                                console.error(
                                    "[RenderElementProvider] Fallback schema validation failed.",
                                    fallbackError
                                );
                            }
                            return null;
                        }
                    } else {
                        if (process.env.NODE_ENV !== "production") {
                            console.error(
                                `[RenderElementProvider] Schema validation failed for element "${effectiveRaw.type}" (${id}).`,
                                error
                            );
                        }
                        return null;
                    }
                }

                const container = getWidgetContainer(id);
                if (!container) return null;

                const finalProps =
                    transformProps?.({
                        id,
                        meta,
                        element: elementMeta,
                        parsedProps,
                        raw: effectiveRaw,
                    }) ?? parsedProps;

                const Component = elementMeta.component as ComponentType<any>;
                let rendered: React.ReactNode = <Component {...(finalProps as any)} />;
                if (wrapElement) {
                    rendered = wrapElement({
                        id,
                        meta,
                        element: rendered,
                        elementMeta,
                        parsedProps,
                        raw: effectiveRaw,
                    });
                }

                return (
                    <RenderElementContext.Provider key={id} value={{ widget: { id } }}>
                        {createPortal(rendered, container)}
                    </RenderElementContext.Provider>
                );
            })}
        </>
    );
};

export function useRenderElement() {
    const context = useContext(RenderElementContext);
    if (!context) {
        throw new Error("useRenderElement must be used within a RenderElementProvider");
    }
    return context;
}
