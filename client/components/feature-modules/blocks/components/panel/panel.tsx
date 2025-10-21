import { useCallback, useMemo } from "react";
import { z } from "zod";
import { useGrid } from "../../../grid/provider/grid-provider";
import { createRenderElement } from "../../../render/util/render-element.registry";
import { PanelGridWorkspace, usePlayground } from "../demo/block-demo";
import { InsertHandle } from "../insert-handle";
import { RenderBlock } from "../render";
import { PanelWrapper } from "./panel-wrapper";

const PanelWidgetSchema = z.object({
    panelId: z.string(),
    parentPath: z.array(z.string()).optional(),
});

/**
 * This is the overaching panel widget component that will render a block panel, its nested blocks and actions.
 * @returns
 */
const PanelWidget: React.FC<z.infer<typeof PanelWidgetSchema>> = ({ panelId, parentPath }) => {
    const playground = usePlayground();
    const { removeWidget } = useGrid();
    const block = playground.getBlock(panelId, parentPath);

    // compute values without depending on `block`
    const childrenLen = block?.children?.length ?? 0;
    const isTopLevel = !parentPath || parentPath.length === 0;
    const handleDelete = useCallback(() => {
        removeWidget(panelId);
        playground.removePanel(panelId);
    }, [panelId, playground, removeWidget]);

    const panelActions = useMemo(
        () =>
            playground.quickActionsFor(panelId).map((action) =>
                action.id === "delete"
                    ? {
                          ...action,
                          onSelect: () => handleDelete(),
                      }
                    : action
            ),
        [panelId, handleDelete, playground]
    );

    if (!block) return null;

    return (
        <PanelWrapper
            id={block.id}
            title={block.title}
            description={block.description}
            badge={block.badge}
            slashItems={playground.slashItems}
            quickActions={panelActions}
            onInsert={(item) => playground.insertNested(block.id, item, childrenLen)}
            onInsertSibling={(item) => {
                if (!isTopLevel) return;
                const topLevelIndex = playground.blocks.findIndex((b) => b.id === block.id);
                const insertAt = topLevelIndex >= 0 ? topLevelIndex + 1 : playground.blocks.length;
                playground.insertPanel(item, insertAt);
            }}
            onDelete={handleDelete}
            nested={
                childrenLen > 0 ? (
                    <div className="rounded-lg border border-dashed/60 bg-background/40 p-4">
                        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                            Nested blocks
                        </h3>
                        <PanelGridWorkspace parentPath={[...(parentPath ?? []), block.id]} />
                    </div>
                ) : null
            }
            nestedFooter={
                <div className="pt-3">
                    <InsertHandle
                        items={playground.slashItems}
                        label="Add nested block"
                        onSelect={(item) => playground.insertNested(block.id, item, childrenLen)}
                    />
                </div>
            }
        >
            <RenderBlock tree={block.tree} display={block.display} />
        </PanelWrapper>
    );
};

export const panelRegistry = {
    BLOCK_PANEL: createRenderElement({
        type: "BLOCK_PANEL",
        name: "Block panel",
        description: "Editable block panel container",
        category: "BLOCK",
        schema: PanelWidgetSchema,
        component: PanelWidget,
    }),
};
