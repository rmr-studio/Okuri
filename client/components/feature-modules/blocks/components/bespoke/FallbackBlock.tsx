import { FC } from "react";
import { z } from "zod";
import { RenderElementMetadata } from "../../util/block/block.registry";

const schema = z
    .object({
        reason: z.string().optional(),
    })
    .passthrough();

const FallbackComponent: FC<z.infer<typeof schema>> = ({ reason }) => (
    <div className="rounded border p-3 text-sm opacity-70">
        Unsupported component{reason ? `: ${reason}` : ""}
    </div>
);

export const FallbackBlock: RenderElementMetadata<typeof schema> = {
    type: "FALLBACK",
    name: "Fallback",
    description: "Default component rendered when no mapping exists.",
    schema,
    component: FallbackComponent,
};

export { FallbackComponent };
