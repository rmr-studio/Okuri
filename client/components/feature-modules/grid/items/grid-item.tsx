import { ClassNameProps, FCWC } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import React from "react";

interface Props extends ClassNameProps {
    id?: string;
    "data-gs-x"?: number;
    "data-gs-y"?: number;
    "data-gs-w"?: number;
    "data-gs-h"?: number;
    style?: React.CSSProperties;
}

export const GridItem: FCWC<Props> = ({ id, children, className, style, ...props }) => {
    return (
        <div id={id} className={cn("grid-stack-item", className)} style={style} {...props}>
            <div className="grid-stack-item-content">{children}</div>
        </div>
    );
};

export const ChartWidget: React.FC<{ title?: string; data?: any }> = ({
    title = "Chart Widget",
    data,
}) => (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded h-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="h-32 bg-blue-100 rounded flex items-center justify-center">
            Chart Content Here
        </div>
    </div>
);

export const TableWidget: React.FC<{ title?: string; data?: any[] }> = ({
    title = "Table Widget",
    data = [],
}) => (
    <div className="p-4 bg-green-50 border border-green-200 rounded h-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="h-32 bg-green-100 rounded flex items-center justify-center">
            Table Content Here
        </div>
    </div>
);

export const TextWidget: React.FC<{ title?: string; content?: string }> = ({
    title = "Text Widget",
    content = "This is a text widget",
}) => (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded h-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm">{content}</p>
    </div>
);

export const MediaWidget: React.FC<{ title?: string; src?: string }> = ({
    title = "Media Widget",
    src,
}) => (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded h-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="h-32 bg-purple-100 rounded flex items-center justify-center">
            {src ? (
                <img src={src} alt={title} className="max-h-full max-w-full object-contain" />
            ) : (
                "Media Content Here"
            )}
        </div>
    </div>
);
