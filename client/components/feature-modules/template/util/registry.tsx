import { PencilIcon } from "lucide-react";
import { z, ZodTypeAny } from "zod";
import { BadgeWidget } from "../widgets/atomic/badge-widget";
import { ChartWidget } from "../widgets/atomic/chart-widget";
import { DateWidget } from "../widgets/atomic/date-widget";
import { MediaWidget } from "../widgets/atomic/media-widget";
import { TableWidget } from "../widgets/atomic/table-widget";
import { TextWidget } from "../widgets/atomic/text-widget";

const WIDGET_TYPE = ["TEXT", "MEDIA", "CHART", "BADGE", "TABLE", "DATE"] as const;
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
    MEDIA: MediaWidget,
    CHART: ChartWidget,
    BADGE: BadgeWidget,
    TABLE: TableWidget,
    DATE: DateWidget,
} as const;

// Inferred discriminated union
export type WidgetProps<W> = W extends WidgetMetadata<infer T> ? z.infer<T> : never;
export type WidgetRegistry = typeof WIDGETS;
export type AnyWidget = WidgetRegistry[keyof WidgetRegistry];
