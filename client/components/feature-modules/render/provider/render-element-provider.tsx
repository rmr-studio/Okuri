"use client";

/**
 * Binds GridStack widget metadata to concrete React components.
 *
 * The provider iterates over the registered widgets, parses their payloads,
 * validates props against the schema defined in the render element registry,
 * and portals the resulting component into the DOM node GridStack owns.
 */

import type { GridStackWidget } from "gridstack";
import { ComponentType, createContext, FC, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useContainer } from "@/components/feature-modules/grid/provider/grid-container-provider";
import { useGrid } from "@/components/feature-modules/grid/provider/grid-provider";
import {
    RenderElementMetadata,
    RenderElementRegistry,
} from "@/components/feature-modules/render/util/render-element.registry";

interface ParsedContent {
    type: string;
    props?: unknown;
    componentId?: string;
    slot?: string;
    parentId?: string;
}

/** Parse the serialised widget payload back into a typed object. */
function parseContent(meta: GridStackWidget): ParsedContent | null {
    if (!meta.content) return null;
    try {
        const payload = JSON.parse(meta.content);
        if (payload && typeof payload.type === "string") {
            return { type: payload.type, props: payload.props ?? payload };
        }
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("[RenderElementProvider] Failed to parse widget content", error);
        }
    }
    return null;
}

export const RenderElementContext = createContext<{ widget: { id: string } } | null>(null);

interface ProviderProps {
    registry: RenderElementRegistry;
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

export const RenderElementProvider: FC<ProviderProps> = ({
    registry,
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

                let elementMeta = registry[raw.type];
                let effectiveRaw = raw;

                if (!elementMeta) {
                    onUnknownType?.({ id, raw });
                    const fallbackMeta = registry["FALLBACK"];
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

/** Access the context created by `RenderElementProvider`. */
export function useRenderElement() {
    const context = useContext(RenderElementContext);
    if (!context) {
        throw new Error("useRenderElement must be used within a RenderElementProvider");
    }
    return context;
}
