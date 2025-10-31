/**
 * Utility for creating render element metadata entries for the block registry.
 */

import { ComponentType } from "react";
import { z, ZodTypeAny } from "zod";
import { RenderElementMetadata } from "../block/block.registry";

interface CreateRenderElementOptions<T extends ZodTypeAny> {
    type: string;
    name?: string;
    description?: string;
    icon?: ComponentType<any>;
    schema: T;
    component: ComponentType<z.infer<T>>;
}

/**
 * Helper function to create a properly typed RenderElementMetadata object.
 *
 * @param options - Configuration for the render element
 * @returns RenderElementMetadata that can be registered in the block registry
 */
export function createRenderElement<T extends ZodTypeAny>(
    options: CreateRenderElementOptions<T>
): RenderElementMetadata<T> {
    return {
        type: options.type,
        name: options.name,
        description: options.description,
        icon: options.icon,
        schema: options.schema,
        component: options.component,
    };
}
