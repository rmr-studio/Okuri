// binding.ts
import { TreeCtx } from "@/components/feature-modules/blocks/components/render";
import {
    BlockBinding,
    BlockComponentNode,
    BlockReference,
} from "@/components/feature-modules/blocks/interface/block.interface";
import jp from "jsonpointer"; // tiny util; or write your own

export function getByPath(obj: unknown, pointer: string): any {
    if (!pointer) return undefined;
    // allow shorthand "name" -> "$.data/name"
    const p = pointer.startsWith("$.") ? pointer.replace("$", "") : `/data/${pointer}`;
    try {
        return jp.get(obj as any, p);
    } catch {
        return undefined;
    }
}

export function applyBindings(node: BlockComponentNode, ctx: TreeCtx): object {
    const { props, bindings } = node;
    if (bindings.length === 0) return props;
    const out = { ...props };

    for (const binding of bindings) {
        if (isDataPath(binding.source)) {
            const value = getByPath({ data: ctx.payload }, binding.source.path);
            setDeep(out, binding.prop, value);
            continue;
        }

        if (isRefSlot(binding.source)) {
            const { slot, presentation = "SUMMARY", fields } = binding.source;
            const list: BlockReference[] = ctx.references?.[slot] ?? [];

            if (presentation === "INLINE") {
                // For INLINE, pass through BLOCK refs (owned); container will render them.
                const blocksOnly = list.filter((r) => r.entityType === "BLOCK");
                setDeep(out, binding.prop, blocksOnly);
                continue;
            }

            // SUMMARY/LINKED: project summary/entity
            const rows = list.map((ref) => {
                const entity = ref.entity ?? {};
                if (!fields || fields.length === 0)
                    return { ...(entity as any), entityId: ref.entityId };

                const pick: Record<string, unknown> = {};
                for (const f of fields) pick[f] = (entity as any)?.[f];
                pick.entityId = ref.entityId;
                return pick;
            });
            setDeep(out, binding.prop, rows);
            continue;
        }

        if (isComputed(binding.source)) {
            // MVP: not implemented; set undefined or leave as-is
            setDeep(out, binding.prop, undefined);
            continue;
        }

        // Fallback (shouldn't happen if all cases handled)
        setDeep(out, binding.prop, undefined);
    }

    return out;
}

function setDeep(obj: any, path: string, value: any) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        cur[k] = cur[k] ?? {};
        cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
}

function isRefSlot(
    src: BlockBinding["source"]
): src is Extract<BlockBinding["source"], { type: "RefSlot" }> {
    return src.type === "RefSlot";
}
function isDataPath(
    src: BlockBinding["source"]
): src is Extract<BlockBinding["source"], { type: "DataPath" }> {
    return src.type === "DataPath";
}
function isComputed(
    src: BlockBinding["source"]
): src is Extract<BlockBinding["source"], { type: "Computed" }> {
    return src.type === "Computed";
}

// visibility.ts
