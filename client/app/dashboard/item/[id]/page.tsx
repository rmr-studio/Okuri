"use client";
import LineItemForm, {
    LineItemFormSchema,
    LineItemFormType,
} from "@/components/feature-modules/line-item/LineItemForm";
import { useAuth } from "@/components/provider/AuthContext";
import {
    getLineItemById,
    updateLineItem,
} from "@/controller/lineitem.controller";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const LineItemOverviewPage = () => {
    const { id } = useParams();
    const form = useForm<LineItemFormType>({
        resolver: zodResolver(LineItemFormSchema),
        defaultValues: { name: "", description: "", chargeRate: "" },
    });
    const { session } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchLineItem = async () => {
            setError(null);
            setLoading(true);
            try {
                const item = await getLineItemById(session, id as string);
                form.reset({
                    name: item.name,
                    description: item.description || "",
                    chargeRate: item.chargeRate.toString(),
                });
            } catch (e: any) {
                setError(e?.message || "Failed to load line item");
            } finally {
                setLoading(false);
            }
        };
        if (id && session) fetchLineItem();
    }, [id, session]);

    const handleSubmission = async (data: LineItemFormType) => {
        setError(null);
        setSaving(true);
        try {
            await updateLineItem(session, {
                id: id as string,
                name: data.name,
                description: data.description,
                chargeRate: Number(data.chargeRate),
            });
            router.push("/dashboard/item");
        } catch (e: any) {
            setError(e?.message || "Failed to update line item");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading line item...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="max-w-xl mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-4">Edit Line Item</h1>
            <LineItemForm
                form={form}
                handleSubmission={handleSubmission}
                renderFooter={() => (
                    <div className="mt-4 flex flex-col gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Update Line Item"}
                        </button>
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                    </div>
                )}
            />
        </div>
    );
};

export default LineItemOverviewPage;
