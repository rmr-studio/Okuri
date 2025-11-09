import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FC } from "react";

interface LineItemData {
    description?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    total?: number;
    [key: string]: unknown;
}

interface Props {
    item?: LineItemData;
    currency?: string;
}

function formatCurrency(value?: number, currency = "AUD") {
    if (value == null || Number.isNaN(value)) return "-";
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            currencyDisplay: "symbol",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return value.toString();
    }
}

export const InvoiceLineItemCard: FC<Props> = ({ item, currency }) => {
    if (!item) return null;
    const { description, quantity, unit, unitPrice, total } = item;
    return (
        <Card className="flex flex-col border-border/60">
            <CardHeader>
                <CardTitle className="text-base font-medium">
                    {description ?? "Line item"}
                </CardTitle>
                <CardDescription>
                    {quantity != null ? `${quantity} ${unit ?? ""}`.trim() : null}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex justify-between text-sm text-muted-foreground">
                <div>
                    <div>Unit price</div>
                    <div className="text-foreground font-medium">
                        {formatCurrency(unitPrice, currency)}
                    </div>
                </div>
                <div className="text-right">
                    <div>Total</div>
                    <div className="text-foreground font-semibold">
                        {formatCurrency(total, currency)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
