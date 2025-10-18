import { z } from "zod";
import { createRenderElement } from "../../render/util/render-element.registry";
import { BlockSurface } from "./BlockSurface";
import { InlineInsertHandle, PanelGridWorkspace, usePlayground } from "./demo/block-demo";
import { RenderBlock } from "./render";

const PanelWidgetSchema = z.object({
    panelId: z.string(),
    parentPath: z.array(z.string()).optional(),
});

export const PanelWidget: React.FC<z.infer<typeof PanelWidgetSchema>> = ({
    panelId,
    parentPath,
}) => {
    const playground = usePlayground();
    const block = playground.getBlock(panelId, parentPath);
    if (!block) return null;

    const children = block.children ?? [];

    const isTopLevel = !parentPath || parentPath.length === 0;

    return (
        <BlockSurface
            id={block.id}
            title={block.title}
            description={block.description}
            badge={block.badge}
            slashItems={playground.slashItems}
            quickActions={playground.quickActionsFor(block.id)}
            onInsert={(item) => playground.insertNested(block.id, item, children.length)}
            onInsertSibling={(item) => {
                if (!isTopLevel) return;
                const topLevelIndex = playground.blocks.findIndex((b) => b.id === block.id);
                const insertAt = topLevelIndex >= 0 ? topLevelIndex + 1 : playground.blocks.length;
                playground.insertPanel(item, insertAt);
            }}
            nested={
                children.length > 0 ? (
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
                    <InlineInsertHandle
                        label="Add nested block"
                        onSelect={(item) =>
                            playground.insertNested(block.id, item, children.length)
                        }
                    />
                </div>
            }
        >
            <RenderBlock tree={block.tree} display={block.display} />
        </BlockSurface>
    );
};


export const panelRegistry = {
    BLOCK_PANEL: createRenderElement({
        type: "BLOCK_PANEL",
        name: "Block panel",
        description: "Editable block surface for the playground",
        category: "BLOCK",
        schema: PanelWidgetSchema,
        component: PanelWidget,
    }),
};
