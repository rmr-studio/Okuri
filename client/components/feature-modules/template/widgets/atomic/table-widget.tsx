import { Table2Icon } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/registry";
import { WidgetSchema } from "../widget";

const TableWidgetSchema = WidgetSchema.extend({
    type: z.literal("TABLE"),
    data: z.object({
        columns: z.array(
            z.object({
                key: z.string(),
                label: z.string(),
                type: z.enum(["text", "number", "date"]).default("text"),
            })
        ),
        rows: z.array(z.record(z.any())).default([]),
    }),
});

type Props = z.infer<typeof TableWidgetSchema>;

const Widget: FC<Props> = ({ id, data: { columns, rows } }) => {
    return <div>Table Widget</div>;
};

export const TableWidget = createWidget({
    type: TableWidgetSchema.shape.type._def.value,
    name: "Table",
    description: "A widget to display tabular data.",
    icon: Table2Icon,
    schema: TableWidgetSchema,
    component: Widget,
});
