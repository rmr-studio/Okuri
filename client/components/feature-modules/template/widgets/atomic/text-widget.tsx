import { TextQuoteIcon } from "lucide-react";
import { CSSProperties, FC } from "react";
import { z } from "zod";
import { createWidget } from "../../util/registry";
import { WidgetSchema } from "../widget.schema";

export const TextStyleSchema = z.object({
    size: z.number().min(8).max(72).default(16),
    weight: z.enum(["light", "normal", "bold"]).default("normal"),
    horizontalAlign: z.enum(["left", "center", "right"]).default("center"),
    verticalAlign: z.enum(["top", "center", "bottom"]).default("center"),
    italic: z.boolean().default(false),
    underline: z.boolean().default(false),
    strikethrough: z.boolean().default(false),
    color: z.string().default("#000000"),
    backgroundColor: z.string().default("#FFFFFF"),
    padding: z.number().min(0).max(50).default(5),
    margin: z.number().min(0).max(50).default(5),
    borderRadius: z.number().min(0).max(50).default(0),
    borderWidth: z.number().min(0).max(20).default(1),
    borderColor: z.string().default("#000000"),
    shadow: z.boolean().default(false),
    shadowColor: z.string().default("#000000"),
    shadowOffsetX: z.number().min(0).max(20).default(0),
    shadowOffsetY: z.number().min(0).max(20).default(0),
    shadowBlur: z.number().min(0).max(20).default(0),
    shadowOpacity: z.number().min(0).max(1).default(0.5),
    opacity: z.number().min(0).max(1).default(1),
    lineHeight: z.number().min(1).max(3).default(1.5),
    letterSpacing: z.number().min(0).max(10).default(0),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).default("none"),
    textOverflow: z.enum(["clip", "ellipsis"]).default("clip"),
    whiteSpace: z.enum(["normal", "nowrap", "pre", "pre-wrap", "pre-line"]).default("normal"),
    wordBreak: z.enum(["normal", "break-all", "keep-all", "break-word"]).default("normal"),
    maxLines: z.number().min(1).max(100).default(0),
    link: z.string().url().optional(),
    linkTarget: z.enum(["_self", "_blank", "_parent", "_top"]).default("_self"),
});

export const TextWidgetSchema = z.object({
    ...WidgetSchema.shape,
    content: z.string().min(1).max(100).default("Sample Text"),
    style: TextStyleSchema.default({}),
});

type Props = z.infer<typeof TextWidgetSchema>;

export const Text: FC<Props> = ({ content, style }) => {
    const css: CSSProperties = {
        fontSize: style.size,
        fontWeight: style.weight,
        fontStyle: style.italic ? "italic" : "normal",
        textDecoration: [
            style.underline ? "underline" : "",
            style.strikethrough ? "line-through" : "",
        ]
            .filter(Boolean)
            .join(" "),
        color: style.color,
        backgroundColor: style.backgroundColor,
        padding: style.padding,
        margin: style.margin,
        borderRadius: style.borderRadius,
        borderWidth: style.borderWidth,
        borderStyle: style.borderWidth > 0 ? "solid" : "none",
        borderColor: style.borderColor,
        opacity: style.opacity,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
        display: "-webkit-box", // needed for maxLines
        WebkitLineClamp: style.maxLines > 0 ? style.maxLines : undefined,
        WebkitBoxOrient: style.maxLines > 0 ? "vertical" : undefined,
        overflow: style.maxLines > 0 ? "hidden" : undefined,
        boxShadow: style.shadow
            ? `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${
                  style.shadowBlur
              }px rgba(${hexToRgb(style.shadowColor)}, ${style.shadowOpacity})`
            : undefined,
        textAlign: style.horizontalAlign,
        // verticalAlign doesn’t apply to block elements directly — would need flex or grid container
    };

    const contentElement = style.link ? (
        <a href={style.link} target={style.linkTarget}>
            {content}
        </a>
    ) : (
        content
    );

    return <div style={css}>{contentElement}</div>;
};

// util: convert hex to rgb string
function hexToRgb(hex: string): string {
    const cleaned = hex.replace("#", "");
    const bigint = parseInt(cleaned, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

export const TextWidget = createWidget({
    type: "TEXT",
    name: "Text",
    description: "A widget to display customizable text content.",
    icon: TextQuoteIcon,
    schema: TextWidgetSchema,
    component: Text,
});
