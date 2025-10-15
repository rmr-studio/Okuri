import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import React from "react";
import { AddressCard } from "./AddressCard";
import { InvoiceLineItemCard } from "./InvoiceLineItemCard";
import { TaskCard } from "./TaskCard";

type ItemComponentKey = "ADDRESS_CARD" | "PROJECT_TASK" | "INVOICE_LINE_ITEM" | string;

interface Props {
    items?: any[];
    itemComponent?: ItemComponentKey;
    title?: string;
    description?: string;
    emptyMessage?: string;
    currency?: string;
}

type Renderer = React.ComponentType<{
    data: any;
    context: Omit<Props, "items" | "itemComponent">;
}>;

const componentMap: Record<string, Renderer> = {
    ADDRESS_CARD: ({ data }) => <AddressCard address={data} />,
    PROJECT_TASK: ({ data }) => <TaskCard task={data} />,
    INVOICE_LINE_ITEM: ({ data, context }) => (
        <InvoiceLineItemCard item={data} currency={context.currency} />
    ),
};

/**
 * Renders OWNED child block refs inline.
 * Expects props.items = RefRow[] where each row.entity.payload.data is the child block's data.
 */
export const InlineOwnedList: React.FC<Props> = ({
    items,
    itemComponent,
    title,
    description,
    emptyMessage = "No items",
    currency,
}) => {
    const rows = items ?? [];
    const Renderer =
        (itemComponent && componentMap[itemComponent]) ??
        (({ data }: { data: any; context: Omit<Props, "items" | "itemComponent"> }) => (
            <pre className="text-xs bg-muted/40 p-3 rounded border border-border/50 overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        ));

    const content =
        rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
            <div className="grid gap-3">
                {rows.map((ref: any, index: number) => {
                    const data = ref?.entity?.payload?.data ?? ref;
                    const key = ref?.entityId ?? index;
                    return <Renderer key={key} data={data} context={{ title, description, currency }} />;
                })}
            </div>
        );

    if (title || description) {
        return (
            <Card className="transition-shadow duration-150 hover:shadow-lg">
                <CardHeader>
                    {title ? <CardTitle className="text-base font-semibold">{title}</CardTitle> : null}
                    {description ? <CardDescription>{description}</CardDescription> : null}
                </CardHeader>
                <CardContent>{content}</CardContent>
            </Card>
        );
    }

    return content;
};
