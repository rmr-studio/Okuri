import { Badge } from "@/components/ui/badge";
import { ShieldIcon } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/registry";
import { WidgetSchema } from "../widget";

const BadgeWidgetSchema = WidgetSchema.extend({
    type: z.literal("BADGE"),
    data: z.object({
        label: z.string().default("Status"),
        variant: z.enum(["default", "secondary", "destructive", "outline"]).default("default"),
        size: z.enum(["sm", "md", "lg"]).default("md"),
    }),
});

type Props = z.infer<typeof BadgeWidgetSchema>;

const Widget: FC<Props> = ({ id, data: { label, variant, size } }) => {
    return <Badge variant={variant}>{label}</Badge>;
};

export const BadgeWidget = createWidget({
    type: BadgeWidgetSchema.shape.type._def.value,
    name: "Badge",
    description: "A widget to display a badge or label.",
    icon: ShieldIcon,
    schema: BadgeWidgetSchema,
    component: Widget,
});
