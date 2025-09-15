import { FCWC } from "@/lib/interfaces/interface";
import { z } from "zod";

export const InteractionSchema = z.object({
    deletable: z.boolean().default(true),
});

export const WidgetSchema = z.object({
    id: z.string().min(1, "ID is required"),
    type: z.literal("text"), // to be overridden
    data: z.record(z.any()).default({}), // to be overridden
    position: z.object({
        x: z.number().min(0, "X must be at least 0"),
        y: z.number().min(0, "Y must be at least 0"),
        width: z.number().min(1, "Width must be at least 1"),
        height: z.number().min(1, "Height must be at least 1"),
    }),
    interactions: InteractionSchema.default({}),
});

export type BaseWidget = z.infer<typeof WidgetSchema>;

export interface WidgetProps {
    onDelete?: (id: string) => void;
}

export const Widget: FCWC<WidgetProps> = ({ onDelete }) => {
    return <div className="relative">Widget</div>;
};
