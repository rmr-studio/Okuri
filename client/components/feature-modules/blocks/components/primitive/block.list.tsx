import { createRenderElement } from "../../util/render/render-element.registry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { FC } from "react";
import { z } from "zod";
import { AddressCard } from "../bespoke/AddressCard";
import { InvoiceLineItemCard } from "../bespoke/InvoiceLineItemCard";
import { TaskCard } from "../bespoke/TaskCard";

type ItemComponentKey = "ADDRESS_CARD" | "PROJECT_TASK" | "INVOICE_LINE_ITEM" | string;

const Schema = z
    .object({
        items: z.array(z.any()).optional(),
        itemComponent: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        emptyMessage: z.string().optional(),
        currency: z.string().optional(),
    })
    .passthrough();

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

// Extract the actual React components from RenderElementMetadata
const AddressCardComponent = AddressCard.component as FC<any>;
const TaskCardComponent = TaskCard.component as FC<any>;
const InvoiceLineItemCardComponent = InvoiceLineItemCard.component as FC<any>;

const componentMap: Record<string, Renderer> = {
    ADDRESS_CARD: ({ data }) => <AddressCardComponent address={data} />,
    PROJECT_TASK: ({ data }) => <TaskCardComponent task={data} />,
    INVOICE_LINE_ITEM: ({ data, context }) => (
        <InvoiceLineItemCardComponent item={data} currency={context.currency} />
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
export const Block: React.FC<Props> = ({
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
            <Card className="h-full flex flex-col transition-shadow duration-150 hover:shadow-lg">
                <CardHeader>
                    {title ? (
                        <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    ) : null}
                    {description ? <CardDescription>{description}</CardDescription> : null}
                </CardHeader>
                <CardContent className="flex-1">{content}</CardContent>
            </Card>
        );
    }

    return <div className="h-full flex flex-col">{content}</div>;
};

export const ListBlock = createRenderElement({
    type: "LINE_ITEM",
    name: "Inline owned list",
    description: "Renders owned child block references inline.",
    category: "BLOCK",
    schema: Schema,
    component: Block,
});
