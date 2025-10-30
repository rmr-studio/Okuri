import { createRenderElement } from "../../util/render/render-element.registry";
import { cn } from "@/lib/util/utils";
import { FC, JSX } from "react";
import { z } from "zod";

interface Props {
    text?: string;
    variant?: "title" | "subtitle" | "body" | "muted";
    align?: "left" | "center" | "right";
    className?: string;
}

const Schema = z
    .object({
        text: z.string().optional(),
        variant: z.enum(["title", "subtitle", "body", "muted"]).optional(),
        align: z.enum(["left", "center", "right"]).optional(),
        className: z.string().optional(),
    })
    .passthrough();

const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
    title: "text-2xl font-semibold text-foreground",
    subtitle: "text-lg font-medium text-foreground",
    body: "text-base text-foreground",
    muted: "text-sm text-muted-foreground",
};

const alignClasses: Record<NonNullable<Props["align"]>, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
};

const tagMap: Record<NonNullable<Props["variant"]>, string> = {
    title: "h3",
    subtitle: "h4",
    body: "p",
    muted: "p",
};

const Block: FC<Props> = ({ text, variant = "body", align = "left", className }) => {
    if (!text) return null;
    const Tag = tagMap[variant] as keyof JSX.IntrinsicElements;
    return (
        <Tag className={cn(variantClasses[variant], alignClasses[align], className)}>{text}</Tag>
    );
};

export const TextBlock = createRenderElement({
    type: "TEXT",
    name: "Text block",
    description: "Simple text display with styling options.",
    category: "BLOCK",
    schema: Schema,
    component: Block,
});
