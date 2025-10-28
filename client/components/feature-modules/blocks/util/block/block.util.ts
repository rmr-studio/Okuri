import { Condition, GridRect } from "@/lib/interfaces/common.interface";
import { TreeCtx } from "../../components/render";
import { BlockNode, ContentNode } from "../../interface/block.interface";
import { getByPath } from "./block.binding";

export function evalVisible(cond: Condition | undefined, ctx: TreeCtx): boolean {
    if (!cond) return true;
    const left =
        cond.left.kind === "Path"
            ? getByPath({ data: ctx.payload }, cond.left.path)
            : cond.left.value;
    const right = cond.right
        ? cond.right.kind === "Path"
            ? getByPath({ data: ctx.payload }, cond.right.path)
            : cond.right.value
        : undefined;

    switch (cond.op) {
        case "EXISTS":
            return left !== undefined && left !== null;
        case "EMPTY":
            return left == null || (Array.isArray(left) && left.length === 0) || left === "";
        case "NOT_EMPTY":
            return !(left == null || (Array.isArray(left) && left.length === 0) || left === "");
        case "EQUALS":
            return left === right;
        case "NOT_EQUALS":
            return left !== right;
        case "IN":
            return Array.isArray(right) && right.includes(left);
        case "NOT_IN":
            return Array.isArray(right) && !right.includes(left);
        case "GT":
            return Number(left) > Number(right);
        case "GTE":
            return Number(left) >= Number(right);
        case "LT":
            return Number(left) < Number(right);
        case "LTE":
            return Number(left) <= Number(right);
        default:
            return true;
    }
}

export const allowChildren = (node: BlockNode): boolean => {
    return !!node.block.type.nesting;
};

export const insertChild = (parent: ContentNode, child: BlockNode, slotName: string): BlockNode => {
    if (!allowChildren(parent)) {
        return parent;
    }

    const existingSlot = parent.children?.[slotName];
    if (!existingSlot) {
        // Slot does not exist, create it
        const newChildren = {
            ...(parent.children ?? {}),
            [slotName]: [child],
        };

        return {
            ...parent,
            children: newChildren,
        };
    }

    // Slot exists, append to it
    const newChildren = {
        ...parent.children,
        [slotName]: [...existingSlot, child],
    };

    return {
        ...parent,
        children: newChildren,
    };
};

/**
 * Returns the current dimensions of a block node, either from its explicit layout, if the block has been moved/resized,
 * or its default layout from the block type.
 * @param node The block node to get dimensions for.
 * @returns The GridRect representing the block's dimensions.
 */
export const getCurrentDimensions = (node: BlockNode): GridRect => {
    return node.block.layout ?? node.block.type.display.render.layoutGrid.layout;
};
