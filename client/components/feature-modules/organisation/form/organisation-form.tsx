"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AddressFormSchema } from "@/components/ui/forms/bespoke/AddressFormSection";
import { CustomAttributesFormSchema } from "@/components/ui/forms/bespoke/CustomAttributesFormSection";
import { PaymentDetailsFormSchema } from "@/components/ui/forms/bespoke/PaymentDetailsFormSection";
import { FormStepper } from "@/components/ui/forms/form-stepper";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import { Step } from "@/lib/util/form/form.util";
import { cn, isValidCurrency } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import OrganisationDetailsForm from "./1.organisation-details";
import OrganisationBillingForm from "./2.organisation-billing";
import OrganisationAttributesForm from "./3.organisation-attributes";
import { OrganisationFormPreview } from "./organisation-preview";

const OrganisationDetailsFormSchema = z.object({
    displayName: z
        .string({ required_error: "Display Name is required" })
        .min(3, "Display Name is too short"),
    plan: z.enum(["FREE", "STARTUP", "SCALE", "ENTERPRISE"]),
    defaultCurrency: z.string().min(3).max(3).refine(isValidCurrency),
    avatarUrl: z.string().url().optional(),
    isDefault: z.boolean(),
    businessNumber: z.string().optional(),
    taxId: z.string().optional(),
    address: AddressFormSchema,
    payment: PaymentDetailsFormSchema.optional(),
    customAttributes: CustomAttributesFormSchema,
});

export type OrganisationFormDetails = z.infer<typeof OrganisationDetailsFormSchema>;
export type OrganisationFormTab = "base" | "billing" | "custom";

interface Props extends ClassNameProps {
    organisation?: Organisation;
    renderHeader: () => React.ReactNode;
    onSubmit: (values: OrganisationFormDetails) => Promise<void>;
    setUploadedAvatar: (file: Blob | null) => void;
}

export interface OrganisationStepFormProps {
    form: UseFormReturn<OrganisationFormDetails>;
    setUploadedAvatar: (file: Blob | null) => void;
    handlePreviousPage: (tab: OrganisationFormTab) => void;
    handleNextPage: (tab: OrganisationFormTab) => void;
    handleFormSubmit: (values: OrganisationFormDetails) => Promise<void>;
}

export const OrganisationForm: FC<Props> = ({
    organisation,
    onSubmit,
    setUploadedAvatar,
    renderHeader,
    className,
}) => {
    const { data: user } = useProfile();
    const [activeTab, setActiveTab] = useState<OrganisationFormTab>("base");

    const form: UseFormReturn<OrganisationFormDetails> = useForm<OrganisationFormDetails>({
        resolver: zodResolver(OrganisationDetailsFormSchema),
        defaultValues: {
            displayName: organisation?.name || "",
            avatarUrl: organisation?.avatarUrl || undefined,
            isDefault: user?.memberships.length === 0,
            plan: organisation?.plan || "FREE",
            defaultCurrency: organisation?.defaultCurrency?.currencyCode || "AUD",
            businessNumber: organisation?.businessNumber || "",
            taxId: organisation?.taxId || "",
            address: {
                street: organisation?.address?.street || "",
                city: organisation?.address?.city || "",
                state: organisation?.address?.state || "",
                postalCode: organisation?.address?.postalCode || "",
                country: organisation?.address?.country || "AU",
            },
            payment: {
                bsb: organisation?.organisationPaymentDetails?.bsb || "",
                accountNumber: organisation?.organisationPaymentDetails?.accountNumber || "",
                accountName: organisation?.organisationPaymentDetails?.accountName || "",
            },
            customAttributes: organisation?.customAttributes || {},
        },
    });

    const handleNextPage = (tab: OrganisationFormTab) => {
        setActiveTab(tab);
    };

    const handlePreviousPage = (tab: OrganisationFormTab) => {
        setActiveTab(tab);
    };

    const renderStepComponent = (tab: OrganisationFormTab) => {
        const props: OrganisationStepFormProps = {
            form: form,
            setUploadedAvatar: setUploadedAvatar,
            handlePreviousPage: handlePreviousPage,
            handleNextPage: handleNextPage,
            handleFormSubmit: onSubmit,
        };

        const tabMap: Record<OrganisationFormTab, React.ReactNode> = {
            base: <OrganisationDetailsForm {...props} />,
            billing: <OrganisationBillingForm {...props} />,
            custom: <OrganisationAttributesForm {...props} />,
        };

        return tabMap[tab] || <OrganisationDetailsForm {...props} />;
    };

    const steps: Step<OrganisationFormTab>[] = [
        {
            identifier: "base",
            step: 1,
            title: "Organisation Details",
            description: "Enter your organisation's basic details",
        },
        {
            identifier: "billing",
            step: 2,
            title: "Billing Information",
            description:
                "Provide your organisations billing information for invoicing and report generation purposes",
        },
        {
            identifier: "custom",
            step: 3,
            title: "Custom Attributes",
            description:
                "Add any additional attributes for your organisation to be used in invoices and reports",
        },
    ];

    return (
        <div className="flex flex-col md:flex-row p-2 min-h-[100dvh]">
            <section className={cn("w-full md:w-2/5", className)}>
                <header>{renderHeader()}</header>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <section className="mr-8">
                            <FormField
                                control={form.control}
                                name="isDefault"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-end gap-2 mt-4 mb-2">
                                        <FormControl>
                                            <Checkbox
                                                disabled={user?.memberships.length === 0}
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                            Set as default organisation
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </section>
                        <section className="mt-2">
                            <FormStepper
                                steps={steps}
                                currentStep={activeTab}
                                descriptionType="icon"
                            />
                            <Separator className="mt-6 mb-4" />
                        </section>
                        {renderStepComponent(activeTab)}
                    </form>
                </Form>
            </section>
            <section className="flex flex-grow flex-col relative bg-accent rounded-sm">
                <div className="sticky top-8">
                    <OrganisationFormPreview data={form.watch()} />
                </div>
            </section>
        </div>
    );
};
