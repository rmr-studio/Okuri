"use client";
import PayCalculator, {
    PayCalculatorBillableRow,
} from "@/components/feature-modules/invoice/PayCalculator";
import { Button } from "@/components/ui/button";
import { useClient } from "@/hooks/useClient";
import { useLineItem } from "@/hooks/useLineItem";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const NewInvoicePage = () => {
    const searchParams = useSearchParams();
    const initialClientId = searchParams.get("clientId") || "";
    const { data: clients, isLoading: loadingClients } = useClient();
    const { data: lineItems, isLoading: loadingLineItems } = useLineItem();
    const [clientId, setClientId] = useState(initialClientId);
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [isDraft, setIsDraft] = useState(false);
    const [billables, setBillables] = useState<PayCalculatorBillableRow[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(true);

    // Calculate invoice total
    const invoiceTotal = billables.reduce(
        (sum, r) => sum + (isNaN(r.total) ? 0 : r.total),
        0
    );

    const handlePreview = () => setShowPreview(true);
    const handleSaveDraft = () => setIsDraft(true);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Validate and submit invoice
        alert("Invoice submitted (stub)");
    };

    // Helper to get client name
    const getClientName = () => {
        if (!clients) return "";
        const client = clients.find((c) => c.id === clientId);
        return client ? client.name : "";
    };
    // Helper to get line item name
    const getLineItemName = (id: string) => {
        if (!lineItems) return "";
        const li = lineItems.find((l) => l.id === id);
        return li ? li.name : "";
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-background">
            {/* Sticky Actions Header */}
            <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4 flex flex-wrap gap-4 justify-end shadow-sm">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePreview}
                >
                    Preview Invoice
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                >
                    Save as Draft
                </Button>
                <Button type="submit" form="invoice-form" variant="primary">
                    Submit Invoice
                </Button>
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-auto px-6 py-8">
                <form
                    id="invoice-form"
                    onSubmit={handleSubmit}
                    className="space-y-8"
                >
                    {/* Collapsible Invoice Details */}
                    <section className="bg-background rounded-lg shadow border border-border">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">
                                Invoice Details
                            </h2>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setDetailsOpen((open) => !open)}
                            >
                                {detailsOpen ? "Hide" : "Show"}
                            </Button>
                        </div>
                        {detailsOpen && (
                            <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1 text-foreground">
                                        Client
                                    </label>
                                    {loadingClients ? (
                                        <div className="text-muted-foreground">
                                            Loading clients...
                                        </div>
                                    ) : (
                                        <select
                                            className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                                            value={clientId}
                                            onChange={(e) =>
                                                setClientId(e.target.value)
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select a client
                                            </option>
                                            {clients &&
                                                clients.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </option>
                                                ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-foreground">
                                        Invoice Number
                                    </label>
                                    <input
                                        className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                                        type="text"
                                        value={invoiceNumber}
                                        onChange={(e) =>
                                            setInvoiceNumber(e.target.value)
                                        }
                                        placeholder="Auto-generated or enter manually"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-foreground">
                                        Period Start
                                    </label>
                                    <input
                                        className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                                        type="date"
                                        value={periodStart}
                                        onChange={(e) =>
                                            setPeriodStart(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-foreground">
                                        Period End
                                    </label>
                                    <input
                                        className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                                        type="date"
                                        value={periodEnd}
                                        onChange={(e) =>
                                            setPeriodEnd(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                    {/* Pay Calculator */}
                    <section className="bg-background rounded-lg shadow border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4 text-foreground">
                            Pay Calculator
                        </h2>
                        {loadingLineItems ? (
                            <div className="text-muted-foreground">
                                Loading line items...
                            </div>
                        ) : (
                            <PayCalculator
                                lineItems={lineItems || []}
                                onChange={setBillables}
                                initialBillables={billables}
                            />
                        )}
                        <div className="mt-4 text-right text-lg font-bold text-primary">
                            Invoice Total:{" "}
                            <span>${invoiceTotal.toFixed(2)}</span>
                        </div>
                    </section>
                </form>
                {/* Invoice Preview Modal (styled) */}
                {showPreview && (
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 flex items-center justify-center z-50 print:bg-transparent print:relative print:inset-auto">
                        <div className="bg-background rounded-lg shadow-lg p-8 max-w-2xl w-full relative print:shadow-none print:p-4 border border-border">
                            <button
                                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground print:hidden"
                                onClick={() => setShowPreview(false)}
                            >
                                ×
                            </button>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-foreground">
                                    Invoice Preview
                                </h2>
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            Client:
                                        </div>
                                        <div className="text-foreground">
                                            {getClientName()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            Invoice #:
                                        </div>
                                        <div className="text-foreground">
                                            {invoiceNumber || (
                                                <span className="text-muted-foreground">
                                                    (auto)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            Period:
                                        </div>
                                        <div className="text-foreground">
                                            {periodStart} to {periodEnd}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <table className="min-w-full border rounded bg-background mb-4 border-border">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="px-2 py-2 text-left text-foreground">
                                            Line Item
                                        </th>
                                        <th className="px-2 py-2 text-left text-foreground">
                                            Rate Type
                                        </th>
                                        <th className="px-2 py-2 text-right text-foreground">
                                            Rate
                                        </th>
                                        <th className="px-2 py-2 text-right text-foreground">
                                            Hours/Distance
                                        </th>
                                        <th className="px-2 py-2 text-right text-foreground">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billables.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="text-center text-muted-foreground py-4"
                                            >
                                                No billable items
                                            </td>
                                        </tr>
                                    ) : (
                                        billables.map((row, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-b border-border"
                                            >
                                                <td className="px-2 py-1 text-foreground">
                                                    {getLineItemName(
                                                        row.lineItemId
                                                    )}
                                                </td>
                                                <td className="px-2 py-1 text-foreground">
                                                    {row.rateType.replace(
                                                        "_",
                                                        " "
                                                    )}
                                                </td>
                                                <td className="px-2 py-1 text-right text-foreground">
                                                    ${row.rate.toFixed(2)}
                                                </td>
                                                <td className="px-2 py-1 text-right text-foreground">
                                                    {row.hoursOrDistance}
                                                </td>
                                                <td className="px-2 py-1 text-right text-foreground">
                                                    ${row.total.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
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
                                    </tr>
                                </tfoot>
                            </table>
                            <div className="flex justify-end print:hidden">
                                <button
                                    className="btn btn-outline mr-2"
                                    onClick={() => window.print()}
                                >
                                    Print
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowPreview(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewInvoicePage;
