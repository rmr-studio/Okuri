import { AlertCircle } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { RenderElementMetadata } from "../../util/block/block.registry";

const schema = z
    .object({
        blockId: z.string().optional(),
    })
    .passthrough();

const MissingBlockErrorComponent: FC<z.infer<typeof schema>> = ({ blockId }) => (
    <div className="flex items-center gap-3 rounded border border-destructive/50 bg-destructive/10 p-4 text-sm">
        <AlertCircle className="size-5 shrink-0 text-destructive" />
        <div className="flex flex-col gap-1">
            <p className="font-medium text-destructive">Block not found</p>
            <p className="text-xs text-muted-foreground">
                The block referenced in the layout does not exist in the environment.
                {blockId && (
                    <>
                        <br />
                        <span className="font-mono">ID: {blockId}</span>
                    </>
                )}
            </p>
        </div>
    </div>
);

export const MissingBlockError: RenderElementMetadata<typeof schema> = {
    type: "MISSING_BLOCK_ERROR",
    name: "Missing Block Error",
    description: "Error component displayed when a block in the layout is missing from the environment.",
    schema,
    component: MissingBlockErrorComponent,
};

export { MissingBlockErrorComponent };
