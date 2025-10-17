"use client";

import { FC } from "react";
import { WidgetRegistry } from "../util/widget.registry";
import {
    RenderElementProvider,
    useRenderElement,
} from "@/components/feature-modules/render/provider/render-element-provider";

interface Props {
    map: WidgetRegistry;
    onDelete: (id: string) => void;
}

export const WidgetRenderProvider: FC<Props> = ({ map, onDelete }) => {
    return (
        <RenderElementProvider
            registry={map}
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
