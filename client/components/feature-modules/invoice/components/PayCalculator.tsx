import { LineItem } from "@/components/feature-modules/invoice/interface/invoice.interface";
import { useState } from "react";

const RATE_TYPES = [
    { value: "WEEKDAY", label: "Weekday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" },
    { value: "PUBLIC_HOLIDAY", label: "Public Holiday" },
    { value: "TRAVEL", label: "Travel" },
];

function getDefaultRate(lineItem: LineItem, rateType: string): number {
    // For demo: just return chargeRate for all except travel
    if (rateType === "TRAVEL") return 1.0;
    return lineItem.chargeRate;
}

export interface PayCalculatorBillableRow {
    lineItemId: string;
    rateType: string;
    rate: number;
    hoursOrDistance: number;
    total: number;
}

interface PayCalculatorProps {
    lineItems: LineItem[];
    onChange: (billables: PayCalculatorBillableRow[]) => void;
    initialBillables?: PayCalculatorBillableRow[];
}

const PayCalculator: React.FC<PayCalculatorProps> = ({ lineItems, onChange, initialBillables }) => {
    const [rows, setRows] = useState<PayCalculatorBillableRow[]>(
        initialBillables && initialBillables.length > 0
            ? initialBillables
            : [
                  {
                      lineItemId: "",
                      rateType: "WEEKDAY",
                      rate: 0,
                      hoursOrDistance: 0,
                      total: 0,
                  },
              ]
    );

    // Helper to get line item by id
    const getLineItem = (id: string) => lineItems.find((li) => li.id === id);

    // Update a row and recalculate total
    const updateRow = (idx: number, changes: Partial<PayCalculatorBillableRow>) => {
        setRows((prev) => {
            const updated = [...prev];
            const row = { ...updated[idx], ...changes };
            // Auto-fill rate if line item or rate type changes
            if ((changes.lineItemId && row.lineItemId) || (changes.rateType && row.rateType)) {
                const li = getLineItem(row.lineItemId);
                if (li && row.rateType !== "TRAVEL") {
                    row.rate = getDefaultRate(li, row.rateType);
                } else if (row.rateType === "TRAVEL") {
                    row.rate = 1.0;
                }
            }
            // Calculate total
            row.total =
                row.rateType === "TRAVEL"
                    ? row.rate * row.hoursOrDistance
                    : row.rate * row.hoursOrDistance;
            updated[idx] = row;
            onChange(updated);
            return updated;
        });
    };

    // Add a new row
    const addRow = () => {
        setRows((prev) => [
            ...prev,
            {
                lineItemId: "",
                rateType: "WEEKDAY",
                rate: 0,
                hoursOrDistance: 0,
                total: 0,
            },
        ]);
    };

    // Remove a row
    const removeRow = (idx: number) => {
        setRows((prev) => {
            const updated = prev.filter((_, i) => i !== idx);
            onChange(updated);
            return updated.length > 0
                ? updated
                : [
                      {
                          lineItemId: "",
                          rateType: "WEEKDAY",
                          rate: 0,
                          hoursOrDistance: 0,
                          total: 0,
                      },
                  ];
        });
    };

    // Calculate invoice total
    const invoiceTotal = rows.reduce((sum, r) => sum + (isNaN(r.total) ? 0 : r.total), 0);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg bg-background border-border">
                <thead>
                    <tr className="bg-muted">
                        <th className="px-2 py-2 text-foreground">Line Item</th>
                        <th className="px-2 py-2 text-foreground">Rate Type</th>
                        <th className="px-2 py-2 text-foreground">Rate</th>
                        <th className="px-2 py-2 text-foreground">
                            {rows[0]?.rateType === "TRAVEL" ? "Distance" : "Hours"}
                        </th>
                        <th className="px-2 py-2 text-foreground">Total</th>
                        <th className="px-2 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx} className="border-b border-border">
                            <td className="px-2 py-1">
                                <select
                                    className="w-full border border-border rounded px-2 py-1 bg-background text-foreground"
                                    value={row.lineItemId}
                                    onChange={(e) =>
                                        updateRow(idx, {
                                            lineItemId: e.target.value,
                                        })
                                    }
                                    required
                                >
                                    <option value="">Select</option>
                                    {lineItems.map((li) => (
                                        <option key={li.id} value={li.id}>
                                            {li.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-2 py-1">
                                <select
                                    className="w-full border border-border rounded px-2 py-1 bg-background text-foreground"
                                    value={row.rateType}
                                    onChange={(e) =>
                                        updateRow(idx, {
                                            rateType: e.target.value,
                                        })
                                    }
                                >
                                    {RATE_TYPES.map((rt) => (
                                        <option key={rt.value} value={rt.value}>
                                            {rt.label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-2 py-1">
                                <input
                                    className="w-full border border-border rounded px-2 py-1 text-right bg-background text-foreground"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.rate}
                                    onChange={(e) =>
                                        updateRow(idx, {
                                            rate: Number(e.target.value),
                                        })
                                    }
                                    required
                                    disabled={row.rateType !== "TRAVEL"}
                                />
                            </td>
                            <td className="px-2 py-1">
                                <input
                                    className="w-full border border-border rounded px-2 py-1 text-right bg-background text-foreground"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.hoursOrDistance}
                                    onChange={(e) =>
                                        updateRow(idx, {
                                            hoursOrDistance: Number(e.target.value),
                                        })
                                    }
                                    required
                                />
                            </td>
                            <td className="px-2 py-1 text-right text-foreground">
                                ${row.total.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-center">
                                <button
                                    type="button"
                                    className="text-destructive hover:text-destructive-foreground rounded px-2 py-1"
                                    onClick={() => removeRow(idx)}
                                    aria-label="Remove row"
                                    disabled={rows.length === 1}
                                >
                                    ×
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td
                            colSpan={4}
                            className="text-right font-semibold px-2 py-2 text-foreground"
                        >
                            Invoice Total
                        </td>
                        <td className="text-right font-bold px-2 py-2 text-primary">
                            ${invoiceTotal.toFixed(2)}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <div className="mt-2 flex justify-end">
                <button type="button" className="btn btn-outline" onClick={addRow}>
                    + Add Row
                </button>
            </div>
        </div>
    );
};

export default PayCalculator;
