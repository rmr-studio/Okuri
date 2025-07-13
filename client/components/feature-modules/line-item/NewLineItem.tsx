"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { useForm } from "react-hook-form";
import { LineItemFormType } from "./LineItemForm";

export const NewLineItem = () => {
    const { session, client: authClient } = useAuth();
    const form = useForm<LineItemFormType>({
        resolver: zodResolver(LineItemFormSchema),
        defaultValues: { name: "", description: "", chargeRate: "" },
    });
    const { session } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmission = async (data: LineItemFormType) => {
        setError(null);
        setLoading(true);
        try {
            await createLineItem(session, {
                name: data.name,
                description: data.description,
                chargeRate: Number(data.chargeRate),
            });
            router.push("/dashboard/item");
        } catch (e: any) {
            setError(e?.message || "Failed to create line item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-8">
            <section className="bg-background border border-border rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-4 text-foreground">
                    Add New Line Item
                </h1>
                <LineItemForm
                    form={form}
                    handleSubmission={handleSubmission}
                    renderFooter={() => (
                        <div className="mt-4 flex flex-col gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Create Line Item"}
                            </button>
                            {error && (
                                <div className="text-destructive text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                />
            </section>
        </div>
    );
};
