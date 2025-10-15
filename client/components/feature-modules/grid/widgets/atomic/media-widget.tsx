import { PictureInPicture2 } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/widget.registry";
import { BaseWidget, BaseWidgetProps, WidgetSchema } from "../widget";

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

type Props = z.infer<typeof MediaWidgetSchema> & BaseWidgetProps;

const Widget: FC<Props> = ({ id, data: { src, alt, fit, width, height }, onDelete, style }) => {
    return (
        <BaseWidget id={id} onDelete={onDelete} style={style}>
            Media Widget
        </BaseWidget>
    );
};

export const MediaWidget = createWidget({
    type: MediaWidgetSchema.shape.type._def.value,
    name: "Media",
    description: "A widget to display images or videos.",
    icon: PictureInPicture2,
    schema: MediaWidgetSchema,
    component: Widget,
});
