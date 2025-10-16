import {
    BlockComponentNode,
    BlockReference,
    BlockRenderStructure,
    BlockTree,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { applyBindings } from "@/components/feature-modules/blocks/util/block.binding";
import { evalVisible } from "@/components/feature-modules/blocks/util/block.visibility";
import React from "react";
import { FallbackComponent, registry } from "../util/block.registry";

export interface TreeCtx {
    payload: object;
    references: Record<string, BlockReference[]>;
}

export const RenderBlock: React.FC<{ tree: BlockTree; display: BlockRenderStructure }> = ({
    tree,
    display,
}) => {
    const ctx: TreeCtx = {
        payload: tree.root.block.payload.data,
        references: tree.root.references ?? {},
    };

    // Replace with Gridstack later; for now we just stack in order.
    return (
        <div className="grid grid-cols-12 gap-4">
            {display.layoutGrid.items.map((item) => {
                const node = display.components[item.id];
                if (!node) {
                    return (
                        <div key={item.id} className="col-span-12 md:col-span-6">
                            <FallbackComponent reason={`Component "${item.id}" not found`} />
                        </div>
                    );
                }
                return (
                    <div key={item.id} className="col-span-12 md:col-span-6">
                        <RenderNode node={node} display={display} ctx={ctx} />
                    </div>
                );
            })}
        </div>
    );
};

const RenderNode: React.FC<{
    node: BlockComponentNode;
    display: BlockRenderStructure;
    ctx: TreeCtx;
}> = ({ node, display, ctx }) => {
    if (!evalVisible(node.visible as any, ctx)) return null;
    const boundProps = applyBindings(node, ctx);

    const slots: Record<string, React.ReactNode> = {};
    for (const [slotName, ids] of Object.entries(node.slots ?? {})) {
        slots[slotName] = ids.map((id) => {
            const child = display.components[id];
            if (!child) {
                return <FallbackComponent key={id} reason={`Component "${id}" not found`} />;
            }
            return <RenderNode key={id} node={child} display={display} ctx={ctx} />;
        });
    }

    const Comp = registry[node.type] ?? FallbackComponent;
    return <Comp {...boundProps} slots={slots} />;
};
