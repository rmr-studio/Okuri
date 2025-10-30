"use client";

import { createContext, FC, ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { ProviderProps } from "../interface/render.interface";
import { BlockStructureRenderer } from "../components/render/block-structure-renderer";
import { parseContent } from "../util/render/render.util";
import { useContainer } from "./grid-container-provider";
import { useGrid } from "./grid-provider";
import { useBlockEnvironment } from "./block-environment-provider";
import { isContentNode } from "../interface/block.interface";

export const RenderElementContext = createContext<{ widget: { id: string } } | null>(null);

/**
 * This provider renders blocks using their BlockRenderStructure.
 *
 * Each widget corresponds to one block, which may contain multiple components.
 * The BlockStructureRenderer handles rendering all components and resolving bindings.
 */
export const RenderElementProvider: FC<ProviderProps> = ({
    transformProps,
    onUnknownType,
    wrapElement,
}) => {
    const { _rawWidgetMetaMap } = useGrid();
    const { getWidgetContainer } = useContainer();
    const { getBlock } = useBlockEnvironment();

    return (
        <>
            {Array.from(_rawWidgetMetaMap.value.entries()).map(([widgetId, meta]) => {
                const raw = parseContent(meta);
                if (!raw) return null;

                const blockId = raw.blockId || widgetId;
                const blockNode = getBlock(blockId);

                if (!blockNode) {
                    console.warn(`Block ${blockId} not found in environment`);
                    return null;
                }

                const container = getWidgetContainer(widgetId);
                if (!container) return null;

                // Get render structure from the parsed content or from the block type
                const renderStructure =
                    raw.renderStructure || blockNode.block.type.display?.render;

                if (!renderStructure) {
                    console.warn(`No render structure found for block ${blockId}`);
                    return null;
                }

                // Get child blocks if this is a content node
                const childBlocks = isContentNode(blockNode) ? blockNode.children || {} : {};

                // Render the block structure with all its components
                let rendered: ReactNode = (
                    <BlockStructureRenderer
                        blockId={blockId}
                        renderStructure={renderStructure}
                        payload={blockNode.block.payload}
                        childBlocks={childBlocks}
                        renderChildBlock={(childNode) => {
                            // Recursively render child blocks
                            // This will be handled by the GridStack subgrid
                            return null;
                        }}
                    />
                );

                // Wrap the entire block structure if wrapElement is provided
                if (wrapElement) {
                    rendered = wrapElement({
                        id: widgetId,
                        meta,
                        element: rendered,
                        elementMeta: null as any,
                        parsedProps: {},
                        raw,
                    });
                }

                return (
                    <RenderElementContext.Provider key={widgetId} value={{ widget: { id: widgetId } }}>
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
