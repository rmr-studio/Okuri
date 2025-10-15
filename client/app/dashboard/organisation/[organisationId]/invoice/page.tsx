"use client";
import { useClient } from "@/components/feature-modules/client/hooks/useClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const INVOICE_STATUSES = ["PENDING", "PAID", "OVERDUE", "OUTDATED", "CANCELLED"];

const InvoiceListPage = () => {
    const router = useRouter();
    const { data: clients = [] } = useClient();
    const [invoices] = useState(mockInvoices); // Replace with real data fetching later
    const [clientFilter, setClientFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Filter logic
    const filteredInvoices = invoices.filter((inv) => {
        const clientMatch = clientFilter ? inv.clientName === clientFilter : true;
        const statusMatch = statusFilter ? inv.status === statusFilter : true;
        return clientMatch && statusMatch;
    });

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-background">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 pt-8 pb-4">
                <h1 className="text-2xl font-bold text-foreground">Your Invoices</h1>
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                            Client
                        </label>
                        <select
                            className="border border-border rounded px-3 py-2 bg-background text-foreground min-w-[160px]"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                        >
                            <option value="">All Clients</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                            Status
                        </label>
                        <select
                            className="border border-border rounded px-3 py-2 bg-background text-foreground min-w-[120px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {INVOICE_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/invoice/new">Add New Invoice</Link>
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-auto px-6 pb-8">
                <table className="min-w-full border rounded-lg bg-background border-border shadow">
                    <thead>
                        <tr className="bg-muted">
                            <th className="px-4 py-2 text-left text-foreground">Invoice #</th>
                            <th className="px-4 py-2 text-left text-foreground">Client</th>
                            <th className="px-4 py-2 text-left text-foreground">Period</th>
                            <th className="px-4 py-2 text-left text-foreground">Total</th>
                            <th className="px-4 py-2 text-left text-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No invoices found.
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr
                                    key={inv.id}
                                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/dashboard/invoice/${inv.id}`)}
                                >
                                    <td className="px-4 py-2 font-mono text-foreground">
                                        {inv.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-2 text-foreground">{inv.clientName}</td>
                                    <td className="px-4 py-2 text-foreground">{inv.period}</td>
                                    <td className="px-4 py-2 text-foreground">
                                        ${inv.total.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Badge
                                            variant={
                                                inv.status === "PAID"
                                                    ? "default"
                                                    : inv.status === "PENDING"
                                                    ? "secondary"
                                                    : "outline"
                                            }
                                        >
                                            {inv.status}
                                        </Badge>
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
