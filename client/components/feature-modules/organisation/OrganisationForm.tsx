"use client";

import { useAuth } from "@/components/provider/AuthContext";
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
import { createOrganisation } from "@/controller/organisation.controller";
import { useProfile } from "@/hooks/useProfile";
import { OrganisationCreationRequest } from "@/lib/interfaces/organisation.interface";
import { Step } from "@/lib/util/form/form.util";
import { isValidCurrency } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerUpLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import OrganisationDetailsForm from "./form/1.details";
import OrganisationBillingForm from "./form/2.billing";
import OrganisationAttributesForm from "./form/3.attributes";

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

export interface OrganisationStepFormProps {
    form: UseFormReturn<OrganisationCreation>;
    setUploadedAvatar: (file: Blob | null) => void;
    handlePreviousPage: (tab: OrganisationFormTab) => void;
    handleNextPage: (tab: OrganisationFormTab) => void;
    handleFormSubmit: (values: OrganisationCreation) => Promise<void>;
}

export const OrganisationForm = () => {
    const { session, client } = useAuth();
    const { data: user } = useProfile();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();

    const queryClient = useQueryClient();

    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);
    const [activeTab, setActiveTab] = useState<OrganisationFormTab>("base");

    const organisationCreationForm: UseFormReturn<OrganisationCreation> =
        useForm<OrganisationCreation>({
            resolver: zodResolver(OrganisationCreationFormSchema),
            defaultValues: {
                displayName: "",
                avatarUrl: undefined,
                isDefault: user?.memberships.length === 0,
                plan: "FREE",
                defaultCurrency: "AUD",
                businessNumber: "",
                taxId: "",
                address: {
                    street: "",
                    city: "",
                    state: "",
                    postalCode: "",
                    country: "AU",
                },
                payment: {
                    bsb: undefined,
                    accountNumber: undefined,
                    accountName: undefined,
                },
                customAttributes: {},
            },
        });

    const organisationMutation = useMutation({
        mutationFn: (organisation: OrganisationCreationRequest) =>
            createOrganisation(session, organisation, uploadedAvatar),
        onMutate: () => {
            toastRef.current = toast.loading("Creating Organisation...");
        },
        onSuccess: (_) => {
            toast.dismiss(toastRef.current);
            toast.success("Organisation created successfully");

            if (!user) {
                router.push("/dashboard/organisation");
                return;
            }

            // Update user profile with new organisation
            queryClient.invalidateQueries({
                queryKey: ["userProfile", user.id],
            });

            router.push("/dashboard/organisation");
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create organisation: ${error.message}`);
        },
    });

    const handleSubmission = async (values: OrganisationCreation) => {
        if (!session || !client) {
            toast.error("No active session found");
            return;
        }

        const organisation: OrganisationCreationRequest = {
            name: values.displayName,
            avatarUrl: values.avatarUrl,
            plan: values.plan,
            defaultCurrency: values.defaultCurrency,
            isDefault: values.isDefault,
            businessNumber: values.businessNumber,
            taxId: values.taxId,
            address: values.address,
            payment: values.payment,
            customAttributes: values.customAttributes,
        };

        // Create the organisation
        organisationMutation.mutate(organisation);
    };

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
            handleFormSubmit: handleSubmission,
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
                    onSubmit={organisationCreationForm.handleSubmit(
                        handleSubmission
                    )}
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
