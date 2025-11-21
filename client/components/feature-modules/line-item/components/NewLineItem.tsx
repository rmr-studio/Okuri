"use client";

import { LineItemCreationRequest } from "@/components/feature-modules/line-item/interface/item.interface";
import { createLineItem } from "@/components/feature-modules/line-item/service/item.service";
import { useAuth } from "@/components/provider/auth-context";
import { useOrganisation } from "@/hooks/useOrganisation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import LineItemForm, { LineItemCreation, LineItemFormSchema } from "./LineItemForm";

export const NewLineItem = () => {
    const { session, client: authClient } = useAuth();
    const { data: organisation, isLoading, isLoadingAuth } = useOrganisation();
    const fetching = isLoading || isLoadingAuth;
    const form = useForm<LineItemCreation>({
        resolver: zodResolver(LineItemFormSchema),
        defaultValues: { name: "", description: "", chargeRate: 0 },
    });

    const [saving, setSaving] = useState(false);
    const toastRef = useRef<string | number | null>(null);

    const router = useRouter();

    const handleCancel = () => {
        router.push("/dashboard/item");
    };

    const lineItemMutation = useMutation({
        mutationFn: async (data: LineItemCreationRequest) => {
            createLineItem(session, data);
        },
        onMutate: () => {
            toastRef.current = toast.loading("Creating line item...");
            setSaving(true);
        },
        onSuccess: () => {
            setSaving(false);
            if (toastRef.current) {
                toast.dismiss(toastRef.current);
                toastRef.current = null;
            }
            toast.success("Line item created successfully!");
            router.push("/dashboard/item");
        },
        onError: (error: any) => {
            console.error("Error creating line item:", error);

            if (toastRef.current) {
                toast.dismiss(toastRef.current);
                toastRef.current = null;
            }
            toast.error(error.message || "Failed to create line item");
        },
    });

    const handleSubmission = async (form: LineItemCreation) => {
        if (!organisation) {
            toast.error("Organisation not found. Please select an organisation.");
            return;
        }

        const lineItemData: LineItemCreationRequest = {
            name: form.name,
            description: form.description,
            chargeRate: form.chargeRate,
            organisationId: organisation.id,
        };

        lineItemMutation.mutate(lineItemData);
    };

    useEffect(() => {
        // Redirect if not authenticated or organisation not loaded
        if (!session || (!organisation && !fetching)) {
            toast.error(
                "Failed to authenticate current user, or selected organisation. Please log in again."
            );
            router.push("/login");
            return;
        }
    }, [session, organisation, fetching]);

    return (
        <div className="max-w-xl mx-auto mt-8">
            <section className="bg-background border border-border rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Add New Line Item</h1>
                <LineItemForm
                    form={form}
                    handleSubmission={handleSubmission}
                    renderFooter={() => (
                        <div className="mt-4 flex flex-col gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? "Saving..." : "Create Line Item"}
                            </button>
                        </div>
                    )}
                />
            </section>
            p{" "}
        </div>
    );
};
