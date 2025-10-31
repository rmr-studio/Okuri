/**
 * BlockStructureRenderer - Renders all components from a BlockRenderStructure.
 *
 * This component is responsible for:
 * 1. Rendering ALL components defined in a block's render structure
 * 2. Resolving bindings to extract props from block payload and child blocks
 * 3. Laying out components using CSS Grid based on layoutGrid coordinates
 * 4. Handling wildcard slots ("*") for dynamic child block rendering
 */

"use client";

import { FC, ReactNode } from "react";
import {
    BlockComponentNode,
    BlockNode,
    BlockRenderStructure,
    Metadata,
} from "../../interface/block.interface";
import { blockRenderRegistry } from "../../util/block/block.registry";
import { getWildcardSlotName, resolveBindings } from "../../util/render/binding.resolver";

interface BlockStructureRendererProps {
    blockId: string;
    renderStructure: BlockRenderStructure;
    payload: Metadata;
    childBlocks: Record<string, BlockNode[]>;
    renderChildBlock?: (node: BlockNode) => ReactNode;
}

/**
 * Renders all components from a BlockRenderStructure within a CSS Grid layout.
 */
export const BlockStructureRenderer: FC<BlockStructureRendererProps> = ({
    blockId,
    renderStructure,
    payload,
    childBlocks,
    renderChildBlock,
}) => {
    const { layoutGrid, components } = renderStructure;

    if (!layoutGrid || !components) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                No render structure defined for this block
            </div>
        );
    }

    // Calculate grid size from layout items
    const maxCol = Math.max(...layoutGrid.items.map((item) => item.lg.x + item.lg.w), 12);
    const maxRow = Math.max(...layoutGrid.items.map((item) => item.lg.y + item.lg.h), 1);

    return (
        <div
            className="block-structure-grid h-full w-full"
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${maxCol}, 1fr)`,
                gridTemplateRows: `repeat(${maxRow}, minmax(${
                    layoutGrid.rowHeight || 40
                }px, auto))`,
                gap: `${layoutGrid.margin || 8}px`,
            }}
        >
            {layoutGrid.items.map((layoutItem) => {
                const component = components[layoutItem.id];

                if (!component) {
                    console.warn(`Component "${layoutItem.id}" not found in components map`);
                    return null;
                }

                return (
                    <ComponentRenderer
                        key={layoutItem.id}
                        component={component}
                        layoutItem={layoutItem}
                        payload={payload}
                        childBlocks={childBlocks}
                        renderChildBlock={renderChildBlock}
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
    layoutItem: any;
    payload: Metadata;
    childBlocks: Record<string, BlockNode[]>;
    renderChildBlock?: (node: BlockNode) => ReactNode;
}> = ({ component, layoutItem, payload, childBlocks, renderChildBlock }) => {
    // Resolve bindings to get component props
    const resolvedProps = resolveBindings(component.bindings || [], payload, childBlocks);
    const finalProps = { ...component.props, ...resolvedProps };

    // Check if this component has wildcard slots
    const wildcardSlot = getWildcardSlotName(component);

    // Position within grid
    const gridStyle = {
        gridColumn: `${layoutItem.lg.x + 1} / span ${layoutItem.lg.w}`,
        gridRow: `${layoutItem.lg.y + 1} / span ${layoutItem.lg.h}`,
    };

    if (wildcardSlot) {
        // Component has wildcard slot - render with child blocks
        return (
            <div style={gridStyle} className="relative h-full flex flex-col">
                <ComponentWithWildcardSlot
                    component={component}
                    props={finalProps}
                    wildcardSlot={wildcardSlot}
                    childBlocks={childBlocks}
                    renderChildBlock={renderChildBlock}
                />
            </div>
        );
    }

    // Regular component - render directly
    return (
        <div style={gridStyle} className="relative h-full flex flex-col">
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

/**
 * Renders a component that has a wildcard slot for dynamic child blocks.
 */
const ComponentWithWildcardSlot: FC<{
    component: BlockComponentNode;
    props: Record<string, unknown>;
    wildcardSlot: string;
    childBlocks: Record<string, BlockNode[]>;
    renderChildBlock?: (node: BlockNode) => ReactNode;
}> = ({ component, props, wildcardSlot, childBlocks, renderChildBlock }) => {
    const childBlockNodes = childBlocks[wildcardSlot] || [];

    const elementMeta = blockRenderRegistry[component.type];
    if (!elementMeta) {
        return (
            <div className="rounded border border-destructive bg-destructive/10 p-4">
                <p className="text-sm font-medium">Unknown component: {component.type}</p>
            </div>
        );
    }

    const Component = elementMeta.component as FC<any>;

    // Render the component with child blocks as children
    return (
        <Component {...props}>
            <>
                {childBlockNodes.map((childNode) => {
                    if (renderChildBlock) {
                        return renderChildBlock(childNode);
                    }
                    // Fallback if no renderChildBlock provided
                    return (
                        <div key={childNode.block.id} className="border border-dashed p-2">
                            Child block: {childNode.block.id}
                        </div>
                    );
                })}
            </>
        </Component>
    );
};
