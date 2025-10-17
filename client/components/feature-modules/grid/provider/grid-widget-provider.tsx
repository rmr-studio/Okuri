"use client";

import {
    RenderElementProvider,
    useRenderElement,
} from "@/components/feature-modules/render/provider/render-element-provider";
import { FC } from "react";
import { RenderElementRegistry } from "../../render/util/render-element.registry";
import { renderElements } from "../../render/util/render-elements.index";

interface Props {
    registry?: RenderElementRegistry;
    onDelete: (id: string) => void;
}

export const WidgetRenderProvider: FC<Props> = ({ registry = renderElements, onDelete }) => {
    return (
        <RenderElementProvider
            registry={registry}
            transformProps={({ id, element, parsedProps }) => ({
                ...(parsedProps as Record<string, unknown>),
                onDelete: () => onDelete(id),
            })}
            onUnknownType={({ id, raw }) => {
                if (process.env.NODE_ENV !== "production") {
                    console.warn(
                        `[WidgetRenderProvider] Unknown widget type "${raw?.type}" for id "${id}".`
                    );
                }
            }}
        />
    );
};

export function useWidget() {
    return useRenderElement();
}
