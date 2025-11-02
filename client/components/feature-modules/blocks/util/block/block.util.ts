import { GridRect } from "@/lib/interfaces/common.interface";
import {
    BlockNode,
    ContentNode,
    isContentMetadata,
    isContentNode,
    isEntityReferenceMetadata,
    isReferenceNode,
} from "../../interface/block.interface";
import { InsertResult } from "../../interface/editor.interface";
import { isList } from "../list/list.util";

// export function evalVisible(cond: Condition | undefined, ctx: TreeCtx): boolean {
//     if (!cond) return true;
//     const left =
//         cond.left.kind === "Path"
//             ? getByPath({ data: ctx.payload }, cond.left.path)
//             : cond.left.value;
//     const right = cond.right
//         ? cond.right.kind === "Path"
//             ? getByPath({ data: ctx.payload }, cond.right.path)
//             : cond.right.value
//         : undefined;

//     switch (cond.op) {
//         case "EXISTS":
//             return left !== undefined && left !== null;
//         case "EMPTY":
//             return left == null || (Array.isArray(left) && left.length === 0) || left === "";
//         case "NOT_EMPTY":
//             return !(left == null || (Array.isArray(left) && left.length === 0) || left === "");
//         case "EQUALS":
//             return left === right;
//         case "NOT_EQUALS":
//             return left !== right;
//         case "IN":
//             return Array.isArray(right) && right.includes(left);
//         case "NOT_IN":
//             return Array.isArray(right) && !right.includes(left);
//         case "GT":
//             return Number(left) > Number(right);
//         case "GTE":
//             return Number(left) >= Number(right);
//         case "LT":
//             return Number(left) < Number(right);
//         case "LTE":
//             return Number(left) <= Number(right);
//         default:
//             return true;
//     }
// }

export const allowChildren = (node: BlockNode): boolean => {
    return !!node.block.type.nesting;
};

export const insertChild = (
    parent: ContentNode,
    child: BlockNode,
    index: number | null = null
): InsertResult<BlockNode> => {
    if (!allowChildren(parent)) {
        return {
            payload: parent,
            success: false,
        };
    }

    if (!parent.children || parent.children?.length === 0) {
        return {
            payload: {
                ...parent,
                children: [child],
            },
            success: true,
        };
    }

    // Either insert at specific index or append to end
    const updatedChildren =
        index !== null
            ? [...parent.children.slice(0, index), child, ...parent.children.slice(index)]
            : [...parent.children, child];

    return {
        payload: {
            ...parent,
            children: updatedChildren,
        },
        success: true,
    };
};

export const getChildren = (node: BlockNode): BlockNode[] | undefined => {
    if (!isContentNode(node) || !node.children) return undefined;

    return node.children;
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

export const getTitle = (node: BlockNode): string => {
    const { block } = node;
    const { name, type } = block;
    return type.name || name || "Untitled Block";
};

export const getAllowedChildTypes = (node: BlockNode): string[] => {
    if (isList(node)) {
        if (isReferenceNode(node) && isEntityReferenceMetadata(node.block.payload)) {
            return node.block.payload.allowedTypes || [];
        }

        if (isContentNode(node) && isContentMetadata(node.block.payload)) {
            return node.block.payload.listConfig?.allowedTypes || [];
        }
    }

    return node.block.type.nesting?.allowedTypes || [];
};
