import { TextWidget } from "../item/text-item";

// Widget Registry for dynamic component rendering
export const WIDGETS = {
    TEXT: TextWidget,
} as const;

export type WidgetType = keyof typeof WIDGETS;
