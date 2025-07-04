"use client";
import PayCalculator, {
    PayCalculatorBillableRow,
} from "@/components/feature-modules/invoice/PayCalculator";
import { useClient } from "@/hooks/useClient";
import { useLineItem } from "@/hooks/useLineItem";
import { useState } from "react";

const NewInvoicePage = () => {
    const { data: clients, isLoading: loadingClients } = useClient();
    const { data: lineItems, isLoading: loadingLineItems } = useLineItem();
    const [clientId, setClientId] = useState("");
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [isDraft, setIsDraft] = useState(false);
    const [billables, setBillables] = useState<PayCalculatorBillableRow[]>([]);

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
        <div className="max-w-3xl mx-auto mt-8 px-2">
            <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Invoice Details */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Invoice Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium mb-1">
                                Client
                            </label>
                            {loadingClients ? (
                                <div>Loading clients...</div>
                            ) : (
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={clientId}
                                    onChange={(e) =>
                                        setClientId(e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select a client</option>
                                    {clients &&
                                        clients.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block font-medium mb-1">
                                Invoice Number
                            </label>
                            <input
                                className="w-full border rounded px-3 py-2"
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) =>
                                    setInvoiceNumber(e.target.value)
                                }
                                placeholder="Auto-generated or enter manually"
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">
                                Period Start
                            </label>
                            <input
                                className="w-full border rounded px-3 py-2"
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">
                                Period End
                            </label>
                            <input
                                className="w-full border rounded px-3 py-2"
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </section>

                {/* Pay Calculator */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Pay Calculator
                    </h2>
                    {loadingLineItems ? (
                        <div>Loading line items...</div>
                    ) : (
                        <PayCalculator
                            lineItems={lineItems || []}
                            onChange={setBillables}
                            initialBillables={billables}
                        />
                    )}
                    <div className="mt-4 text-right text-lg font-bold">
                        Invoice Total:{" "}
                        <span className="text-blue-700">
                            ${invoiceTotal.toFixed(2)}
                        </span>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 justify-end">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handlePreview}
                    >
                        Preview Invoice
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleSaveDraft}
                    >
                        Save as Draft
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Submit Invoice
                    </button>
                </div>
            </form>

            {/* Invoice Preview Modal (styled) */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 print:bg-transparent print:relative print:inset-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative print:shadow-none print:p-4">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 print:hidden"
                            onClick={() => setShowPreview(false)}
                        >
                            ×
                        </button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">
                                Invoice Preview
                            </h2>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                                <div>
                                    <div className="font-semibold">Client:</div>
                                    <div>{getClientName()}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Invoice #:
                                    </div>
                                    <div>
                                        {invoiceNumber || (
                                            <span className="text-gray-400">
                                                (auto)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">Period:</div>
                                    <div>
                                        {periodStart} to {periodEnd}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <table className="min-w-full border rounded bg-white mb-4">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-2 py-2 text-left">
                                        Line Item
                                    </th>
                                    <th className="px-2 py-2 text-left">
                                        Rate Type
                                    </th>
                                    <th className="px-2 py-2 text-right">
                                        Rate
                                    </th>
                                    <th className="px-2 py-2 text-right">
                                        Hours/Distance
                                    </th>
                                    <th className="px-2 py-2 text-right">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {billables.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center text-gray-500 py-4"
                                        >
                                            No billable items
                                        </td>
                                    </tr>
                                ) : (
                                    billables.map((row, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="px-2 py-1">
                                                {getLineItemName(
                                                    row.lineItemId
                                                )}
                                            </td>
                                            <td className="px-2 py-1">
                                                {row.rateType.replace("_", " ")}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                ${row.rate.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                {row.hoursOrDistance}
                                            </td>
                                            <td className="px-2 py-1 text-right">
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
                                        className="text-right font-semibold px-2 py-2"
                                    >
                                        Invoice Total
                                    </td>
                                    <td className="text-right font-bold px-2 py-2">
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
    );
};

export default NewInvoicePage;
