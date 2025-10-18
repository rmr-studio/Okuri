import { ComponentType } from "react";
import { z, ZodTypeAny } from "zod";

export type RenderElementCategory = "BLOCK" | "GRID_WIDGET" | "SHARED";

export interface RenderElementMetadata<T extends ZodTypeAny> {
    type: string;
    name?: string;
    description?: string;
    icon?: ComponentType<any>;
    schema: T;
    component: ComponentType<z.infer<T>>;
    category?: RenderElementCategory;
}

export function createRenderElement<T extends ZodTypeAny>(
    meta: RenderElementMetadata<T>
): RenderElementMetadata<T> {
    return meta;
}

export type RenderElementRegistry = Record<string, RenderElementMetadata<ZodTypeAny>>;

export type InferRenderElementProps<M> = M extends RenderElementMetadata<infer T>
    ? z.infer<T>
    : never;
