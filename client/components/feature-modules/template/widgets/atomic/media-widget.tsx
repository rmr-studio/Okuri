import { PictureInPicture2 } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/registry";
import { WidgetSchema } from "../widget.schema";

const MediaWidgetSchema = WidgetSchema.extend({
    type: z.literal("MEDIA"),
    data: z.object({
        src: z.string().url().optional(), // blank until upload
        alt: z.string().optional(),
        fit: z.enum(["cover", "contain", "fill"]).default("contain"),
        width: z.number().optional(),
        height: z.number().optional(),
    }),
});

type Props = z.infer<typeof MediaWidgetSchema>;

const Widget: FC<Props> = ({ id, data: { src, alt, fit, width, height } }) => {
    return <div>Media Widget</div>;
};

export const MediaWidget = createWidget({
    type: MediaWidgetSchema.shape.type._def.value,
    name: "Media",
    description: "A widget to display images or videos.",
    icon: PictureInPicture2,
    schema: MediaWidgetSchema,
    component: Widget,
});
