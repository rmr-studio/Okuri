import { ChartBarIcon } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/widget.registry";
import { BaseWidget, BaseWidgetProps, WidgetSchema } from "../widget";

const ChartWidgetSchema = WidgetSchema.extend({
    type: z.literal("CHART"),
    data: z.object({
        title: z.string().default("Chart Title"),
        type: z.enum(["bar", "line", "pie", "area"]).default("bar"),
        data: z
            .array(
                z.object({
                    label: z.string().default("Label"),
                    value: z.number().default(0),
                })
            )
            .default([]),
        options: z.record(z.any()).default({}), // Chart.js options or similar
        width: z.number().min(100).max(2000).default(400),
        height: z.number().min(100).max(2000).default(300),
        backgroundColor: z.string().default("#FFFFFF"),
        borderColor: z.string().default("#000000"),
        borderWidth: z.number().min(0).max(20).default(1),
        legendPosition: z.enum(["top", "bottom", "left", "right"]).default("top"),
        showGridLines: z.boolean().default(true),
        xAxisLabel: z.string().optional(),
        yAxisLabel: z.string().optional(),
        responsive: z.boolean().default(true),
        maintainAspectRatio: z.boolean().default(false),
        animationDuration: z.number().min(0).max(10000).default(1000), // in ms
        hoverBackgroundColor: z.string().default("#CCCCCC"),
        hoverBorderColor: z.string().default("#000000"),
        hoverBorderWidth: z.number().min(0).max(20).default(1),
        tooltipEnabled: z.boolean().default(true),
        tooltipBackgroundColor: z.string().default("#000000"),
        tooltipFontColor: z.string().default("#FFFFFF"),
        tooltipBorderColor: z.string().default("#FFFFFF"),
        tooltipBorderWidth: z.number().min(0).max(20).default(1),
        cutoutPercentage: z.number().min(0).max(100).default(0), // for pie/doughnut charts
        rotation: z.number().min(0).max(360).default(0), // for pie/doughnut charts
        circumference: z.number().min(0).max(360).default(360), // for pie/doughnut charts
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
