import { Badge } from "@/components/ui/badge";
import { ShieldIcon } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/widget.registry";
import { BaseWidget, BaseWidgetProps, WidgetSchema } from "../widget";

const BadgeWidgetSchema = WidgetSchema.extend({
    type: z.literal("BADGE"),
    data: z.object({
        label: z.string().default("Status"),
        variant: z.enum(["default", "secondary", "destructive", "outline"]).default("default"),
        size: z.enum(["sm", "md", "lg"]).default("md"),
    }),
});

type Props = z.infer<typeof BadgeWidgetSchema> & BaseWidgetProps;

const Widget: FC<Props> = ({ id, data: { label, variant, size }, _onDelete, style }) => {
    return (
        <BaseWidget id={id} _onDelete={_onDelete} style={style}>
            <Badge variant={variant}>{label}</Badge>
        </BaseWidget>
    );
};

export const BadgeWidget = createWidget({
    type: BadgeWidgetSchema.shape.type._def.value,
    name: "Badge",
    description: "A widget to display a badge or label.",
    icon: ShieldIcon,
    schema: BadgeWidgetSchema,
    component: Widget,
});
