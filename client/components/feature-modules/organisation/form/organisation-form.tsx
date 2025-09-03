"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { AddressFormSchema } from "@/components/ui/forms/bespoke/AddressFormSection";
import { CustomAttributesFormSchema } from "@/components/ui/forms/bespoke/CustomAttributesFormSection";
import { PaymentDetailsFormSchema } from "@/components/ui/forms/bespoke/PaymentDetailsFormSection";
import { FormStepper } from "@/components/ui/forms/form-stepper";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import { Step } from "@/lib/util/form/form.util";
import { isValidCurrency } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CornerUpLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import OrganisationDetailsForm from "./1.organisation-details";
import OrganisationBillingForm from "./2.organisation-billing";
import OrganisationAttributesForm from "./3.organisation-attributes";

const OrganisationCreationFormSchema = z.object({
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

export type OrganisationCreation = z.infer<
    typeof OrganisationCreationFormSchema
>;
export type OrganisationFormTab = "base" | "billing" | "custom";

interface Props {
    organisation?: Organisation;
    onSubmit: (values: OrganisationCreation) => Promise<void>;
    setUploadedAvatar: (file: Blob | null) => void;
}

export interface OrganisationStepFormProps {
    form: UseFormReturn<OrganisationCreation>;
    setUploadedAvatar: (file: Blob | null) => void;
    handlePreviousPage: (tab: OrganisationFormTab) => void;
    handleNextPage: (tab: OrganisationFormTab) => void;
    handleFormSubmit: (values: OrganisationCreation) => Promise<void>;
}

export const OrganisationForm: FC<Props> = ({
    organisation,
    onSubmit,
    setUploadedAvatar,
}) => {
    const { data: user } = useProfile();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<OrganisationFormTab>("base");

    const organisationCreationForm: UseFormReturn<OrganisationCreation> =
        useForm<OrganisationCreation>({
            resolver: zodResolver(OrganisationCreationFormSchema),
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

    const handleCancel = () => {
        router.push("/dashboard/organisation");
    };

    const renderStepComponent = (tab: OrganisationFormTab) => {
        const props: OrganisationStepFormProps = {
            form: organisationCreationForm,
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
        <Card className="w-auto flex-grow lg:max-w-2xl h-fit m-2 md:m-6 lg:m-12 relative">
            <Button
                className="absolute left-4 top-4"
                variant={"secondary"}
                onClick={handleCancel}
            >
                <CornerUpLeftIcon />
                <span className="hidden sm:block">Cancel</span>
            </Button>
            <Form {...organisationCreationForm}>
                <form
                    onSubmit={organisationCreationForm.handleSubmit(onSubmit)}
                >
                    <CardHeader>
                        <CardTitle className="text-center">
                            Create a new organisation
                        </CardTitle>
                        <CardDescription>
                            <br />
                            Your organisation display name will be publicly
                            visible to all users when creating event routers.
                            <br />
                            Your display name will need to be unique.
                        </CardDescription>
                    </CardHeader>
                    <section className="mr-8">
                        <FormField
                            control={organisationCreationForm.control}
                            name="isDefault"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-end gap-2 mt-4 mb-2">
                                    <FormControl>
                                        <Checkbox
                                            disabled={
                                                user?.memberships.length === 0
                                            }
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
        </Card>
    );
};
