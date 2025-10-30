import { FC } from "react";
import { z } from "zod";
import { RenderElementMetadata } from "../../util/block/block.registry";

const schema = z
    .object({
        children: z.any().optional(),
    })
    .passthrough();

const AttachmentBlockComponent: FC<z.infer<typeof schema>> = ({ children }) => (
    <div className="rounded border border-dashed p-3 text-sm text-muted-foreground">
        {children ?? "Attachment placeholder"}
    </div>
);

export const AttachmentBlock: RenderElementMetadata<typeof schema> = {
    type: "ATTACHMENT",
    name: "Attachment placeholder",
    description: "Container for attachment previews or upload dropzones.",
    schema,
    component: AttachmentBlockComponent,
};

export { AttachmentBlockComponent };
