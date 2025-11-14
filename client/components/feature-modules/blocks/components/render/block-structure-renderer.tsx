"use client";

/**
 * BlockStructureRenderer - Renders all components from a BlockRenderStructure.
 *
 * This component is responsible for:
 * 1. Rendering ALL components defined in a block's render structure
 * 2. Resolving bindings to extract props from block payload and child blocks
 */

import { FC } from "react";
import { useLayoutChange } from "../../context/layout-change-provider";
import {
    BlockComponentNode,
    BlockRenderStructure,
    Metadata,
} from "../../interface/block.interface";
import { blockRenderRegistry } from "../../util/block/block.registry";
import { resolveBindings } from "../../util/render/binding.resolver";

interface BlockStructureRendererProps {
    blockId: string;
    renderStructure: BlockRenderStructure;
    payload: Metadata;
}

/**
 * Renders all components from a BlockRenderStructure within a CSS Grid layout.
 */
export const BlockStructureRenderer: FC<BlockStructureRendererProps> = ({
    blockId,
    renderStructure,
    payload,
}) => {
    const { version } = useLayoutChange();
    const { layoutGrid, components } = renderStructure;

    if (!layoutGrid || !components) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                No render structure defined for this block
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            {layoutGrid.items.map((layoutItem) => {
                const component = components[layoutItem.id];

                if (!component) {
                    console.warn(`Component "${layoutItem.id}" not found in components map`);
                    return null;
                }

                return (
                    <ComponentRenderer
                        key={`${blockId}-${layoutItem.id}-${version}`}
                        component={component}
                        payload={payload}
                    />
                );
            })}
        </div>
    );
};

/**
 * Renders a single component from the BlockRenderStructure.
 */
const ComponentRenderer: FC<{
    component: BlockComponentNode;
    payload: Metadata;
}> = ({ component, payload }) => {
    // Resolve bindings to get component props
    const resolvedProps = resolveBindings(component.bindings || [], payload);
    const finalProps = { ...component.props, ...resolvedProps };

    // Regular component - render directly
    return (
        <div className="relative flex flex-col">
            <ComponentInstance component={component} props={finalProps} />
        </div>
    );
};

/**
 * Renders a component instance from the registry.
 */
const ComponentInstance: FC<{
    component: BlockComponentNode;
    props: Record<string, unknown>;
}> = ({ component, props }) => {
    const elementMeta = blockRenderRegistry[component.type];

    if (!elementMeta) {
        // Fallback for unknown component types
        const fallbackMeta = blockRenderRegistry["FALLBACK"];
        if (!fallbackMeta) {
            return (
                <div className="rounded border border-destructive bg-destructive/10 p-4">
                    <p className="text-sm font-medium">Unknown component: {component.type}</p>
                </div>
            );
        }

        const FallbackComponent = fallbackMeta.component as FC<any>;
        return <FallbackComponent reason={`Unknown component type: ${component.type}`} />;
    }

    // Validate props with schema
    let validatedProps: unknown;
    try {
        validatedProps = elementMeta.schema.parse(props);
    } catch (error) {
        console.error(`Schema validation failed for ${component.type}:`, error);

        const fallbackMeta = blockRenderRegistry["FALLBACK"];
        if (fallbackMeta) {
            const FallbackComponent = fallbackMeta.component as FC<any>;
            return <FallbackComponent reason={`Invalid props for component "${component.type}"`} />;
        }

        return (
            <div className="rounded border border-destructive bg-destructive/10 p-4">
                <p className="text-sm font-medium">Invalid props for: {component.type}</p>
            </div>
        );
    }

    const Component = elementMeta.component as FC<any>;

    return <Component {...(validatedProps as any)} />;
};
