import { TreeCtx } from "@/components/feature-modules/blocks/components/render";
import { Condition } from "@/lib/interfaces/common.interface";
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
