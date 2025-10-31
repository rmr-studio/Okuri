import { FC } from "react";
import { z } from "zod";
import { RenderElementMetadata } from "../../util/block/block.registry";

const schema = z
    .object({
        src: z.string().nonempty(),
        alt: z.string().optional(),
        className: z.string().optional(),
    })
    .passthrough();

const ImageBlockComponent: FC<z.infer<typeof schema>> = ({ src, alt, className }) => (
    <img
        src={src}
        alt={alt ?? ""}
        className={className ?? "rounded-md object-cover max-h-64 w-full"}
    />
);

export const ImageBlock: RenderElementMetadata<typeof schema> = {
    type: "IMAGE",
    name: "Image",
    description: "Renders an image with optional styling.",
    schema,
    component: ImageBlockComponent,
};

export { ImageBlockComponent };
