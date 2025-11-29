"use client";

import { NodeType } from "@/lib/types/types";
import { createContext, FC, ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { MissingBlockErrorComponent } from "../components/bespoke/MissingBlockError";
import { editorPanel } from "../components/panel/editor-panel";
import { BlockStructureRenderer } from "../components/render/block-structure-renderer";
import { ContentBlockList } from "../components/render/list/ContentBlockList";
import { PortalContentWrapper } from "../components/render/portal-wrapper";
import {
    BlockNode,
    ContentNode,
    isContentMetadata,
    isContentNode,
    isEntityReferenceMetadata,
    isReferenceNode,
} from "../interface/block.interface";
import { ProviderProps, RenderElementContextValue } from "../interface/render.interface";
import { isList } from "../util/list/list.util";
import { parseContent } from "../util/render/render.util";
import { useBlockEnvironment } from "./block-environment-provider";
import { useContainer } from "./grid-container-provider";
import { useGrid } from "./grid-provider";
import { useLayoutChange } from "./layout-change-provider";
import { useTrackedEnvironment } from "./tracked-environment-provider";

export const RenderElementContext = createContext<RenderElementContextValue | null>(null);

/**
 * This provider renders blocks using their BlockRenderStructure.
 *
 * Each widget corresponds to one block, which may contain multiple components.
 * The BlockStructureRenderer handles rendering all components and resolving bindings.
 */
export const RenderElementProvider: FC<ProviderProps> = ({ onUnknownType, wrapElement }) => {
    const { getBlock, getParent } = useBlockEnvironment();
    const { removeTrackedBlock, addTrackedBlock } = useTrackedEnvironment();
    const { environment } = useGrid();
    const { getWidgetContainer, resizeWidgetToContent } = useContainer();
    const { localVersion } = useLayoutChange();

    const { wrapper: DEFAULT_WRAPPER } = editorPanel({
        getBlock,
        insertBlock: (child, parentId, index) => addTrackedBlock(child, parentId, index),
        removeBlock: removeTrackedBlock,
        getParent,
    });

    const renderList = (node: BlockNode): ReactNode => {
        // Determine List rendering component (Content v Reference Lists)
        if (isReferenceNode(node) && isEntityReferenceMetadata(node.block.payload)) {
            // TODO: Support Entity Reference Listss
            return <>Ill deal with this soon</>;
        }

        if (isContentNode(node) && isContentMetadata(node.block.payload)) {
            const config = node.block.payload.listConfig;
            if (!config) return null;
            return (
                <ContentBlockList
                    id={node.block.id}
                    config={config}
                    children={node.children}
                    render={renderNode}
                />
            );
        }
    };

    const renderNode = (node: ContentNode): ReactNode => {
        const childRenderStructure = node.block.type.display?.render;

        if (!childRenderStructure) {
            return (
                <div className="p-4 text-sm text-muted-foreground">
                    No render structure for {node.block.id}
                </div>
            );
        }

        return (
            <BlockStructureRenderer
                blockId={node.block.id}
                renderStructure={childRenderStructure}
                payload={node.block.payload}
            />
        );
    };

    return (
        <>
            {Array.from(environment.widgetMetaMap.entries()).map(([widgetId, meta]) => {
                // Skip placeholder widgets (used to keep subgrids active)
                if (widgetId.endsWith("-placeholder")) {
                    return null;
                }

                // Extract Node's render structure from widget content
                const nodeData = parseContent(meta);
                if (!nodeData) return null;

                const { id, blockType, renderType } = nodeData;

                const container = getWidgetContainer(widgetId);
                if (!container) return null;

                // Handle error blocks (missing blocks from layout)
                if (blockType === NodeType.ERROR) {
                    const rendered = <MissingBlockErrorComponent blockId={id} />;
                    return (
                        <RenderElementContext.Provider
                            key={widgetId}
                            value={{
                                widget: {
                                    id: widgetId,
                                    container,
                                    requestResize: () => resizeWidgetToContent(widgetId),
                                },
                            }}
                        >
                            {createPortal(
                                <PortalContentWrapper
                                    widgetId={widgetId}
                                    onMount={() => {
                                        requestAnimationFrame(() => {
                                            resizeWidgetToContent(widgetId);
                                        });
                                    }}
                                >
                                    {rendered}
                                </PortalContentWrapper>,
                                container
                            )}
                        </RenderElementContext.Provider>
                    );
                }

                const blockNode = getBlock(id);

                if (!blockNode) {
                    console.warn(`Block ${id} not found in environment`);
                    return null;
                }

                // Compute the rendered components based on provided block metadata
                const rendered: ReactNode = isList(blockNode)
                    ? // Special rendering for List blocks
                      renderList(blockNode)
                    : // Wrap each rendered block inside an editor portal for interactivity
                      (wrapElement ?? DEFAULT_WRAPPER)({
                          children: renderNode(blockNode),
                          widget: meta,
                          content: nodeData,
                      });

                return (
                    <RenderElementContext.Provider
                        key={`${widgetId}-${localVersion}`}
                        value={{
                            widget: {
                                id: widgetId,
                                container,
                                requestResize: () => resizeWidgetToContent(widgetId),
                            },
                        }}
                    >
                        {createPortal(
                            <PortalContentWrapper
                                key={`${widgetId}-${localVersion}`}
                                widgetId={widgetId}
                                onMount={() => {
                                    // Trigger resize after portal content is fully rendered
                                    requestAnimationFrame(() => {
                                        resizeWidgetToContent(widgetId);
                                    });
                                }}
                            >
                                {rendered}
                            </PortalContentWrapper>,
                            container
                        )}
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
