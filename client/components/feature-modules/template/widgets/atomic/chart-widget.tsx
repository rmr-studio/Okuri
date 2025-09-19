import { ChartBarIcon } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/registry";
import { BaseWidget, BaseWidgetProps, WidgetSchema } from "../widget";

const ChartWidgetSchema = WidgetSchema.extend({
    type: z.literal("CHART"),
    data: z.object({
        title: z.string().default("Chart Title"),
        data: z.array(z.number()).default([1, 2, 3, 4, 5]),
    }),
});

type Props = z.infer<typeof ChartWidgetSchema> & BaseWidgetProps;

const Widget: FC<Props> = ({ id, data: { title, data }, onDelete, style }) => {
    return (
        <BaseWidget id={id} onDelete={onDelete} style={style}>
            Chart Widget
        </BaseWidget>
    );
};

export const ChartWidget = createWidget({
    type: ChartWidgetSchema.shape.type._def.value,
    name: "Chart",
    description: "A widget to display charts.",
    icon: ChartBarIcon,
    schema: ChartWidgetSchema,
    component: Widget,
});
