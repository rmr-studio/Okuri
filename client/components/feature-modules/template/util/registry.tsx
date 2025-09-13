import { PencilIcon } from "lucide-react";
import { z, ZodTypeAny } from "zod";
import { TextWidget } from "../widgets/atomic/text-widget";

const WIDGET_TYPE = ["TEXT", "MEDIA", "CHART"] as const;
export type WidgetType = (typeof WIDGET_TYPE)[number];

export interface WidgetMetadata<T extends ZodTypeAny> {
    type: WidgetType;
    name: string;
    description: string;
    icon: typeof PencilIcon;
    schema: T;
    component: React.FC<z.infer<T>>; // enforce schema ↔ props
}

// factory for type inference
export function createWidget<T extends ZodTypeAny>(meta: WidgetMetadata<T>): WidgetMetadata<T> {
    return meta;
}

export const WIDGETS = {
    TEXT: TextWidget,
    MEDIA: TextWidget,
    CHART: TextWidget,
} as const;

// Inferred discriminated union
export type WidgetRegistry = typeof WIDGETS;
export type AnyWidget = WidgetRegistry[keyof WidgetRegistry];
