import { ClassNameProps } from "@/lib/interfaces/interface";
import { FC } from "react";

interface Props extends ClassNameProps {
    content: string;
}

export const TextWidget: FC<Props> = ({ content, className }) => {
    return (
        <div
            className={`w-full h-full flex items-center justify-center bg-muted border border-border rounded ${className}`}
        >
            {content}
        </div>
    );
};
