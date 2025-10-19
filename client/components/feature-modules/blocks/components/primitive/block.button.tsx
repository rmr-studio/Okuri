import { createRenderElement } from "@/components/feature-modules/render/util/render-element.registry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/util/utils";
import Link from "next/link";
import { FC } from "react";
import { z } from "zod";

type Props = z.infer<typeof BlockButtonSchema>;

const BlockButtonSchema = z
    .object({
        label: z.string().optional(),
        href: z.string().optional(),
        className: z.string().optional(),
        variant: z.enum(["default", "secondary", "destructive", "ghost", "outline"]).optional(),
        // Map to buttonVariants size
        size: z.enum(["default", "sm", "lg", "icon"]).optional().nullable(),
        icon: z.any().optional(),
    })
    .passthrough();

const Block: FC<Props> = ({ label = "Button", icon, href, className, ...rest }) => {
    const content = (
        <Button className={cn("w-full justify-center", className)} {...rest}>
            {icon ? <span className="mr-2 inline-flex items-center">{icon}</span> : null}
            {label}
        </Button>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
};

export const ButtonBlock = createRenderElement({
    type: "BUTTON",
    name: "Button",
    description: "Action button that can link to another view.",
    category: "BLOCK",
    schema: BlockButtonSchema,
    component: Block,
});
