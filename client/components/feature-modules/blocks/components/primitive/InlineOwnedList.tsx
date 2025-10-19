import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { AddressCard } from "../bespoke/AddressCard";
import { InvoiceLineItemCard } from "../bespoke/InvoiceLineItemCard";
import { TaskCard } from "../bespoke/TaskCard";

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

const FALLBACK_RENDERER: Renderer = ({ data }) => (
    <pre className="text-xs bg-muted/40 p-3 rounded border border-border/50 overflow-auto">
        {JSON.stringify(data, null, 2)}
    </pre>
);

/**
 * Renders OWNED child block refs inline.
 * Expects props.items = RefRow[] where each row.entity.payload.data is the child block's data.
 */
export const InlineOwnedList: React.FC<Props> = ({
    items: rows = [],
    itemComponent,
    title,
    description,
    emptyMessage = "No items",
    currency,
}) => {
    const Comp = (itemComponent ? componentMap[itemComponent] : undefined) ?? FALLBACK_RENDERER;

    const content =
        rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
            <div className="grid gap-3">
                {rows.map((ref: any, index: number) => {
                    const data = ref?.entity?.payload?.data ?? ref;
                    const key = ref?.entityId ?? index;
                    return (
                        <Comp key={key} data={data} context={{ title, description, currency }} />
                    );
                })}
            </div>
        );

    if (title || description) {
        return (
            <Card className="transition-shadow duration-150 hover:shadow-lg">
                <CardHeader>
                    {title ? (
                        <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    ) : null}
                    {description ? <CardDescription>{description}</CardDescription> : null}
                </CardHeader>
                <CardContent>{content}</CardContent>
            </Card>
        );
    }

    return content;
};
