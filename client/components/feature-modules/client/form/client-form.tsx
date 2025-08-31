"use client";

import { useAuth } from "@/components/provider/auth-context";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { AddressFormSchema } from "@/components/ui/forms/bespoke/AddressFormSection";
import { FormStepper } from "@/components/ui/forms/form-stepper";
import { Client } from "@/lib/interfaces/client.interface";
import type { TemplateClientTemplateFieldStructure } from "@/lib/interfaces/template.interface";
import { Step } from "@/lib/util/form/form.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { FC, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ClientPreview } from "../client-preview";
import { ClientDetailsFormStep } from "./1.client-details";
import { ClientAttributesFormStep } from "./3.client-attributes";

export interface ClientStepFormProps {
    form: UseFormReturn<ClientCreation>;
    selectedTemplate: TemplateClientTemplateFieldStructure | undefined;
    handlePreviousPage: (tab: ClientFormTab) => void;
    handleNextPage: (tab: ClientFormTab) => void;
    handleFormSubmit: (values: ClientCreation) => Promise<void>;
}

const clientCreationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contactDetails: z
        .object({
            email: z.string().email().optional().or(z.literal("")),
            phone: z.string().optional(),
            address: AddressFormSchema.optional(),
        })
        .optional(),
    attributes: z.record(z.any()).default({}).optional(),
});

export type ClientCreation = z.infer<typeof clientCreationSchema>;
export type ClientFormTab = "base" | "attributes";

interface ClientFormProps {
    client?: Client;
    selectedTemplate?: TemplateClientTemplateFieldStructure;
    onTemplateChange?: (template: TemplateClientTemplateFieldStructure) => void;
    onSubmit: (data: ClientCreation) => Promise<void>;
}

export const ClientForm: FC<ClientFormProps> = ({
    selectedTemplate,
    onTemplateChange,
    onSubmit,
    client,
}) => {
    const { session, client: authClient } = useAuth();
    const [activeTab, setActiveTab] = useState<ClientFormTab>("base");

    const form = useForm<ClientCreation>({
        resolver: zodResolver(clientCreationSchema),
        defaultValues: {
            name: "",
            contactDetails: {
                email: "",
                phone: "",
            },
            attributes: {},
        },
        mode: "onBlur",
    });

    const handleNextPage = (tab: ClientFormTab) => {
        setActiveTab(tab);
    };

    const handlePreviousPage = (tab: ClientFormTab) => {
        setActiveTab(tab);
    };

    const renderStepComponent = (tab: ClientFormTab) => {
        const props: ClientStepFormProps = {
            form,
            selectedTemplate: selectedTemplate,
            handlePreviousPage: handlePreviousPage,
            handleNextPage: handleNextPage,
            handleFormSubmit: handleSubmit,
        };

        const tabMap: Record<ClientFormTab, React.ReactNode> = {
            base: <ClientDetailsFormStep {...props} />,
            attributes: <ClientAttributesFormStep {...props} />,
        };

        return tabMap[tab] || <ClientDetailsFormStep {...props} />;
    };

    const handleSubmit = async (data: ClientCreation) => {
        if (!session || !authClient) {
            toast.error("No active session found");
            return;
        }

        // Original component will handle mutation with provided form data
        onSubmit(data);
    };

    const steps: Step<ClientFormTab>[] = [
        {
            identifier: "base",
            step: 1,
            title: "Client Details",
            description: "Enter your clients's basic details",
        },

        {
            identifier: "attributes",
            step: 2,
            title: "Custom Attributes",
            description:
                "Add any additional attributes for your client to help categorize and manage them better.",
        },
    ];

    // TODO: Allow for Template selection here

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Create New Client
                        </h1>
                        <p className="text-muted-foreground">
                            Set up your client profile in just a few steps. This will help your team
                            identify and manage client relationships effectively.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            <Card>
                                {/* Progress Bar */}
                                <section className="mt-2">
                                    <FormStepper
                                        className="max-w-none mx-6"
                                        steps={steps}
                                        currentStep={activeTab}
                                        descriptionType="icon"
                                    />
                                    <Separator className="mt-6 mb-4" />
                                </section>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(handleSubmit)}
                                        className="space-y-6"
                                    >
                                        {renderStepComponent(activeTab)}
                                    </form>
                                </Form>
                            </Card>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <ClientPreview data={form.watch()} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
