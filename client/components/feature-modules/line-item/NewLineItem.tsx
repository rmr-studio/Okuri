"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { createLineItem } from "@/controller/lineitem.controller";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LineItemFormSchema, LineItemFormType } from "./LineItemForm";

export const NewLineItem = () => {
    const { session, client: authClient } = useAuth();
    const form = useForm<LineItemFormType>({
        resolver: zodResolver(LineItemFormSchema),
        defaultValues: { name: "", description: "", chargeRate: 0 },
    });

    const router = useRouter();
    
    

    const handleCancel = () => {
        router.push("/dashboard/item");
    };

    const handleSubmission = async (data: LineItemFormType) => {
        if(!session || !authClient) return;
        
    


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
      p  </div>
    );
};
