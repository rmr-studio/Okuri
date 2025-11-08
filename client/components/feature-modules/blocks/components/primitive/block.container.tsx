import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/util/utils";
import { FC, ReactNode, useEffect, useRef } from "react";
import { z } from "zod";
import { RenderElementMetadata } from "../../util/block/block.registry";

interface Props {
    title?: string;
    description?: string;
    variant?: "card" | "plain";
    padded?: boolean;
    className?: string;
    children?: ReactNode;
}

const Schema = z
    .object({
        title: z.string().optional(),
        description: z.string().optional(),
        variant: z.enum(["card", "plain"]).optional(),
        padded: z.boolean().optional(),
        className: z.string().optional(),
    })
    .passthrough();

export const Block: FC<Props> = ({
    title,
    description,
    variant = "card",
    padded = true,
    className,
    children,
}) => {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const gridItem = host.closest(".grid-stack-item");
        if (!gridItem) return;

        const moveSubGrid = () => {
            const subGrid = gridItem.querySelector(".grid-stack-subgrid") as HTMLElement | null;
            if (subGrid && !host.contains(subGrid)) {
                host.appendChild(subGrid);
            }
        };

        moveSubGrid();

        const observer = new MutationObserver(moveSubGrid);
        observer.observe(gridItem, { childList: true, subtree: true, attributes: false });

        return () => observer.disconnect();
    }, []);

    if (variant === "plain") {
        return (
            <div className={cn("w-full flex flex-col", padded && "p-4", className)}>
                {title || description ? (
                    <div className="mb-4 space-y-1">
                        {title ? <h3 className="text-base font-semibold">{title}</h3> : null}
                        {description ? (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        ) : null}
                    </div>
                ) : null}
                <div ref={hostRef} className="flex-1 w-full">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <Card
            className={cn(
                "w-full flex flex-col transition-shadow duration-150 hover:shadow-lg",
                className
            )}
        >
            {(title || description) && (
                <CardHeader className={padded ? undefined : "pb-2"}>
                    {title ? (
                        <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    ) : null}
                    {description ? <CardDescription>{description}</CardDescription> : null}
                </CardHeader>
            )}
            <CardContent ref={hostRef} className={cn("flex-1", !padded && "px-2 pb-2")}>
                {children}
            </CardContent>
        </Card>
    );
};

export const LayoutContainerBlock: RenderElementMetadata<typeof Schema> = {
    type: "LAYOUT_CONTAINER",
    name: "Layout container",
    description: "Wrapper component that hosts a nested grid layout.",
    schema: Schema,
    component: Block,
};
