import { ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { FC } from "react";

type Status = "healthy" | "unhealthy" | "unknown";

interface Props extends ClassNameProps {
    status: Status;
}

export const StatusIcon: FC<Props> = ({ status, className }) => {
    const statusStyleMap: Record<Status, string> = {
        healthy: "text-green-500 bg-green-500",
        unhealthy: "text-red-500 bg-red-500",
        unknown: "text-yellow-500 bg-yellow-500",
    };

    return <div className={cn("w-2 h-2 rounded-full", statusStyleMap[status], className)} />;
};
