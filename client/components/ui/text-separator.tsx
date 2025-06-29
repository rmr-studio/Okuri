import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/util/utils";
import * as React from "react";

interface TextSeparatorProps {
    children?: React.ReactNode;
    className?: string;
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
}

const TextSeparator = React.forwardRef<React.ElementRef<typeof Separator>, TextSeparatorProps>(
    ({ children, className, orientation = "horizontal", decorative = true, ...props }, ref) => {
        if (!children) {
            return (
                <Separator
                    ref={ref}
                    orientation={orientation}
                    decorative={decorative}
                    className={className}
                    {...props}
                />
            );
        }

        if (orientation === "vertical") {
            return (
                <div className={cn("flex flex-col items-center", className)}>
                    <Separator orientation="vertical" decorative={decorative} className="flex-1" />
                    <div className="px-2 py-1 text-sm text-muted-foreground">{children}</div>
                    <Separator orientation="vertical" decorative={decorative} className="flex-1" />
                </div>
            );
        }

        return (
            <div className={cn("relative flex items-center", className)} {...props}>
                <div className="flex-1">
                    <Separator decorative={decorative} />
                </div>
                <div className="px-4 text-sm text-muted-foreground bg-background">{children}</div>
                <div className="flex-1">
                    <Separator decorative={decorative} />
                </div>
            </div>
        );
    }
);

TextSeparator.displayName = "TextSeparator";

export { TextSeparator };
