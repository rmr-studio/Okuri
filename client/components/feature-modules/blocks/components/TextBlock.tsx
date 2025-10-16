import { cn } from "@/lib/util/utils";
import { FC, JSX } from "react";

interface Props {
    text?: string;
    variant?: "title" | "subtitle" | "body" | "muted";
    align?: "left" | "center" | "right";
    className?: string;
}

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
    title: "h1",
    subtitle: "h2",
    body: "p",
    muted: "p",
};

export const TextBlock: FC<Props> = ({ text, variant = "body", align = "left", className }) => {
    if (!text) return null;
    const Tag = tagMap[variant] as keyof JSX.IntrinsicElements;
    return (
        <Tag className={cn(variantClasses[variant], alignClasses[align], className)}>{text}</Tag>
    );
};
