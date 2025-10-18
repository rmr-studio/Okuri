import { PencilIcon } from "lucide-react";
import { z, ZodTypeAny } from "zod";
import { createRenderElement, RenderElementMetadata } from "@/components/feature-modules/render/util/render-element.registry";
import { AttachmentWidget } from "../widgets/atomic/attachment-widget";
import { BadgeWidget } from "../widgets/atomic/badge-widget";
import { ChartWidget } from "../widgets/atomic/chart-widget";
import { DateWidget } from "../widgets/atomic/date-widget";
import { MediaWidget } from "../widgets/atomic/media-widget";
import { TableWidget } from "../widgets/atomic/table-widget";
import { TextWidget } from "../widgets/atomic/text-widget";

const WIDGET_TYPE = ["TEXT", "MEDIA", "CHART", "BADGE", "TABLE", "DATE", "ATTACHMENT"] as const;
export type WidgetType = (typeof WIDGET_TYPE)[number];

export interface WidgetMetadata<T extends ZodTypeAny> extends RenderElementMetadata<T> {
    type: WidgetType;
    icon: typeof PencilIcon;
}

export function createWidget<T extends ZodTypeAny>(
    meta: WidgetMetadata<T>
): WidgetMetadata<T> {
    return createRenderElement({
        category: meta.category ?? "GRID_WIDGET",
        ...meta,
    }) as WidgetMetadata<T>;
}

export const WIDGETS = {
    TEXT: TextWidget,
    MEDIA: MediaWidget,
    CHART: ChartWidget,
    BADGE: BadgeWidget,
    TABLE: TableWidget,
    DATE: DateWidget,
    ATTACHMENT: AttachmentWidget,
} as const;

// Inferred discriminated union
export type WidgetProps<W> = W extends WidgetMetadata<infer T> ? z.infer<T> : never;
export type WidgetRegistry = typeof WIDGETS;
export type AnyWidget = WidgetRegistry[keyof WidgetRegistry];
