import { Calendar1Icon } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/registry";
import { WidgetSchema } from "../widget.schema";

const DateWidgetSchema = WidgetSchema.extend({
    type: z.literal("DATE"),
    data: z.object({
        value: z.string().optional(), // ISO date
        format: z.string().default("yyyy-MM-dd"),
        mode: z.enum(["date", "datetime", "time"]).default("date"),
    }),
});

type Props = z.infer<typeof DateWidgetSchema>;

const Widget: FC<Props> = ({ id, data: { value, format, mode } }) => {
    return <div>Date Widget</div>;
};

export const DateWidget = createWidget({
    type: DateWidgetSchema.shape.type._def.value,
    name: "Date",
    description: "A widget to display a date or time.",
    icon: Calendar1Icon,
    schema: DateWidgetSchema,
    component: Widget,
});
