"use client";
import Link from "next/link";
import { useState } from "react";

// Placeholder data structure for invoices
const mockInvoices = [
    {
        id: "1",
        invoiceNumber: 1001,
        clientName: "Acme Corp",
        period: "2024-06-01 to 2024-06-07",
        total: 1234.56,
        status: "PENDING",
    },
    {
        id: "2",
        invoiceNumber: 1002,
        clientName: "Beta LLC",
        period: "2024-06-08 to 2024-06-14",
        total: 987.65,
        status: "PAID",
    },
];

const InvoiceListPage = () => {
    // Replace with real data fetching later
    const [invoices] = useState(mockInvoices);

    return (
        <div className="max-w-4xl mx-auto mt-8 px-2">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Your Invoices</h1>
                <Link href="/dashboard/invoice/new" className="btn btn-primary">
                    Add New Invoice
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg bg-white shadow">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Invoice #</th>
                            <th className="px-4 py-2 text-left">Client</th>
                            <th className="px-4 py-2 text-left">Period</th>
                            <th className="px-4 py-2 text-left">Total</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center py-8 text-gray-500"
                                >
                                    No invoices found.
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr
                                    key={inv.id}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="px-4 py-2 font-mono">
                                        {inv.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-2">
                                        {inv.clientName}
                                    </td>
                                    <td className="px-4 py-2">{inv.period}</td>
                                    <td className="px-4 py-2">
                                        ${inv.total.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${
                                                inv.status === "PAID"
                                                    ? "bg-green-100 text-green-700"
                                                    : inv.status === "PENDING"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-200 text-gray-700"
                                            }`}
                                        >
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <Link
                                            href={`/dashboard/invoice/${inv.id}`}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceListPage;
