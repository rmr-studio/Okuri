import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/util/utils";
import Link from "next/link";
import { FC, ReactNode } from "react";

interface Props extends Pick<ButtonProps, "variant" | "size" | "className"> {
    label?: string;
    icon?: ReactNode;
    href?: string;
}

export const BlockButton: FC<Props> = ({ label = "Button", icon, href, className, ...rest }) => {
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
