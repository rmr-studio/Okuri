"use client";
import { useLineItem } from "@/hooks/useLineItem";
import Link from "next/link";

const LineItemPage = () => {
    const { data, isLoading, error } = useLineItem();

    if (isLoading) return <div>Loading line items...</div>;
    if (error)
        return <div className="text-red-500">Failed to load line items</div>;
    if (!data || data.length === 0) return <div>No line items found.</div>;

    return (
        <div className="max-w-3xl mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-4">Your Line Items</h1>
            <div className="grid gap-4">
                {data.map((item) => (
                    <div
                        key={item.id}
                        className="border rounded-lg p-4 shadow bg-white"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-lg font-semibold">
                                {item.name}
                            </div>
                            <Link
                                href={`/dashboard/item/${item.id}`}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                Edit
                            </Link>
                        </div>
                        <div className="text-gray-700 mb-1">
                            <span className="font-medium">Description:</span>{" "}
                            {item.description || "-"}
                        </div>
                        <div className="text-gray-700">
                            <span className="font-medium">Charge Rate:</span> $
                            {item.chargeRate.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LineItemPage;
