"use client";

import { Client } from "@/components/feature-modules/client/interface/client.interface";
import { useAuth } from "@/components/provider/auth-context";
import { Form } from "@/components/ui/form";
import { AddressFormSchema } from "@/components/ui/forms/bespoke/AddressFormSection";
import { FormStepper } from "@/components/ui/forms/form-stepper";
import { ClassNameProps } from "@/lib/interfaces/interface";
import type { TemplateClientTemplateFieldStructure } from "@/lib/interfaces/template.interface";
import { Step } from "@/lib/util/form/form.util";
import { cn } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { FC, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { isMobilePhone } from "validator";
import { z } from "zod";
import { ClientDetailsFormStep } from "./1.client-details";
import { ClientAddressFormStep } from "./2.client-address";
import { ClientAttributesFormStep } from "./3.client-attributes";
import { ClientPreview } from "./client-preview";

export interface ClientStepFormProps {
    form: UseFormReturn<ClientCreation>;
    selectedTemplate: TemplateClientTemplateFieldStructure | undefined;
    handlePreviousPage: (tab: ClientFormTab) => void;
    handleNextPage: (tab: ClientFormTab) => void;
    handleFormSubmit: (values: ClientCreation) => Promise<void>;
}

const clientCreationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contact: z.object({
        email: z.string().email(),
        phone: z
            .union([
                z.literal(""),
                z
                    .string()
                    .min(10, "Please enter a valid phone number for the specified country")
                    .refine(
                        isMobilePhone,
                        "Please enter a valid phone number for the specified country"
                    ),
            ])
            .optional(),
        address: AddressFormSchema.optional(),
    }),
});

export type ClientCreation = z.infer<typeof clientCreationSchema>;
export type ClientFormTab = "base" | "address" | "attributes";

interface ClientFormProps extends ClassNameProps {
    client?: Client;
    selectedTemplate?: TemplateClientTemplateFieldStructure;
    onTemplateChange?: (template: TemplateClientTemplateFieldStructure) => void;
    onSubmit: (data: ClientCreation) => Promise<void>;
    renderHeader: () => React.ReactNode;
}

export const ClientForm: FC<ClientFormProps> = ({
    selectedTemplate,
    onTemplateChange,
    className,
    onSubmit,
    renderHeader,
    client,
}) => {
    const { session, client: authClient } = useAuth();
    const [activeTab, setActiveTab] = useState<ClientFormTab>("base");

    const form = useForm<ClientCreation>({
        resolver: zodResolver(clientCreationSchema),
        defaultValues: {
            name: client?.name || "",
            contact: {
                email: client?.contact.email || "",
                phone: client?.contact?.phone || "",
                address: {
                    street: client?.contact?.address?.street || "",
                    city: client?.contact?.address?.city || "",
                    state: client?.contact?.address?.state || "",
                    postalCode: client?.contact?.address?.postalCode || "",
                    country: client?.contact?.address?.country || "AU",
                },
            },
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
            address: <ClientAddressFormStep {...props} />,
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
            identifier: "address",
            step: 2,
            title: "Billing Address",
            description:
                "Provide your client's address for billing, invoice generation and official documents.",
        },
        {
            identifier: "attributes",
            step: 3,
            title: "Custom Attributes",
            description:
                "Add any additional attributes for your client to help categorize and manage them better.",
        },
    ];

    // TODO: Allow for Template selection here

    return (
        <div className="flex flex-col md:flex-row p-2 min-h-[100dvh] backdrop-blur-sm">
            {/* Form Section */}
            <div className={cn("w-full md:w-2/5", className)}>
                <header>{renderHeader()}</header>
                {/* Progress Bar */}
                <section className="mt-2">
                    <FormStepper
                        className="max-w-none"
                        steps={steps}
                        currentStep={activeTab}
                        descriptionType="icon"
                    />
                    <Separator className="mt-6 mb-4" />
                </section>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        {renderStepComponent(activeTab)}
                    </form>
                </Form>
            </div>

            {/* Preview Section */}
            <div className="flex flex-grow flex-col bg-accent rounded-sm">
                <div className="sticky top-8">
                    <ClientPreview data={form.watch()} />
                </div>
            </div>
        </div>
    );
};
