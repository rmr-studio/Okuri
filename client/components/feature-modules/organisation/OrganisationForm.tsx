"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { AvatarUploader } from "@/components/ui/AvatarUploader";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AddressFormSchema } from "@/components/ui/forms/bespoke/AddressFormSection";
import { CustomAttributesFormSchema } from "@/components/ui/forms/bespoke/CustomAttributesFormSection";
import { PaymentDetailsFormSchema } from "@/components/ui/forms/bespoke/PaymentDetailsFormSection";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createOrganisation } from "@/controller/organisation.controller";
import { useProfile } from "@/hooks/useProfile";
import { OrganisationCreationRequest } from "@/lib/interfaces/organisation.interface";
import { isValidCurrency } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SquareArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

export type OrganisationCreation = z.infer<typeof OrganisationCreationFormSchema>;
export type OrganisationFormTab = "base" | "address" | "billing";

export const OrganisationForm = () => {
    const { session, client } = useAuth();
    const { data: user } = useProfile();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();

    const queryClient = useQueryClient();

    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);
    const handleSubmission = async (values: OrganisationCreation) => {
        if (!session || !client) return;

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

    const organisationCreationForm: UseFormReturn<OrganisationCreation> =
        useForm<OrganisationCreation>({
            resolver: zodResolver(OrganisationCreationFormSchema),
            defaultValues: {
                displayName: "",
                avatarUrl: undefined, // No avatar by default
                isDefault: user?.memberships.length === 0, // Default to false unless user has no memberships
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
                    bsb: "",
                    accountNumber: "",
                    accountName: "",
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

    const handleAvatarUpload = (file: Blob): void => {
        // Store transformed image ready for upload upon form submission
        setUploadedAvatar(file);
        // Set the avatar URL in the form state
        const avatarURL = URL.createObjectURL(file);
        organisationCreationForm.setValue("avatarUrl", avatarURL);
        URL.revokeObjectURL(avatarURL); // Clean up the object URL
    };

    const handleAvatarRemoval = (): void => {
        setUploadedAvatar(null);
        organisationCreationForm.setValue("avatarUrl", undefined);
    };

    const handleCancel = () => {
        router.push("/dashboard/organisation");
    };

    return (
        <Card className="w-auto flex-grow lg:max-w-2xl h-fit m-2 md:m-6 lg:m-12">
            <Form {...organisationCreationForm}>
                <form onSubmit={organisationCreationForm.handleSubmit(handleSubmission)}>
                    <CardHeader>
                        <CardTitle>Create a new organisation</CardTitle>
                        <CardDescription>
                            <br />
                            Your organsation display name will be publically visible to all users
                            when creating event routers.
                            <br />
                            Your display name will need to be unique.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-6">
                            <FormField
                                control={organisationCreationForm.control}
                                name="avatarUrl"
                                render={(_) => (
                                    <FormItem className="flex flex-col lg:flex-row w-full">
                                        <FormLabel className="w-1/3">Organisation Avatar</FormLabel>
                                        <AvatarUploader
                                            onUpload={handleAvatarUpload}
                                            imageURL={organisationCreationForm.getValues(
                                                "avatarUrl"
                                            )}
                                            onRemove={handleAvatarRemoval}
                                            validation={{
                                                maxSize: 5 * 1024 * 1024, // 5MB
                                                allowedTypes: [
                                                    "image/jpeg",
                                                    "image/png",
                                                    "image/webp",
                                                ],
                                                errorMessage:
                                                    "Please upload a valid image file (JPEG, PNG, WebP) under 5MB",
                                            }}
                                        />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={organisationCreationForm.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                        <FormLabel className="w-1/3" htmlFor="displayName">
                                            Organisation Name
                                        </FormLabel>
                                        <Input
                                            id="displayName"
                                            placeholder="My Organisation"
                                            className="w-auto flex-grow"
                                            {...field}
                                            required
                                        />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={organisationCreationForm.control}
                                name="plan"
                                render={({ field }) => (
                                    <FormItem className="flex items-center mt-2 flex-col lg:flex-row">
                                        <div className="w-full md:w-1/3 mt-2">
                                            <FormLabel htmlFor="plan">Organisation Plan</FormLabel>
                                            <Link
                                                href={"/pricing"}
                                                target="_blank"
                                                className="text-xs text-content flex items-center w-fit h-fit mt-2 hover:opacity-50 transition-opacity"
                                            >
                                                Pricing
                                                <SquareArrowUpRight className="w-3 h-3 ml-1" />
                                            </Link>
                                        </div>
                                        <Select
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl className="flex flex-grow w-auto mt-2">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an organisation plan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="STARTUP">Free</SelectItem>
                                                <SelectItem value="STARTUP">Startup</SelectItem>
                                                <SelectItem value="PRO">Growth</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            // TODO: Add a currency selector component
                            

                            <FormField
                                control={organisationCreationForm.control}
                                name="businessNumber"
                                render={({ field }) => (
                                    <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                        <FormLabel className="w-1/3" htmlFor="businessNumber">
                                            Business Number
                                        </FormLabel>
                                        <Input
                                            id="businessNumber"
                                            placeholder="ABN or Business Number"
                                            className="w-auto flex-grow"
                                            {...field}
                                        />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={organisationCreationForm.control}
                                name="taxId"
                                render={({ field }) => (
                                    <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                        <FormLabel className="w-1/3" htmlFor="taxId">
                                            Tax ID
                                        </FormLabel>
                                        <Input
                                            id="taxId"
                                            placeholder="Tax Identification Number"
                                            className="w-auto flex-grow"
                                            {...field}
                                        />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={organisationCreationForm.control}
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

                            {/* Address Section */}
                            <div className="mt-6">
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Address Information
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="address.street"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Street Address</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Street Address"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="address.city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="City" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="address.state"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>State</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="State" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="address.postalCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Postal Code</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Postal Code"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="address.country"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Country</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Country" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details Section */}
                            <div className="mt-6">
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Payment Details (Optional)
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="payment.bsb"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>BSB</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="000-000"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9]/g,
                                                                        ""
                                                                    );
                                                                if (value.length <= 6) {
                                                                    const formatted = value.replace(
                                                                        /(\d{3})(\d{0,3})/,
                                                                        "$1-$2"
                                                                    );
                                                                    field.onChange(formatted);
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="payment.accountNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Number</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Account Number"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={organisationCreationForm.control}
                                            name="payment.accountName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Account Name"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Attributes Section */}
                            <div className="mt-6">
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Custom Attributes (Optional)
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Add custom fields specific to your organisation. These will
                                        be stored as JSON data.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="text-sm text-gray-500">
                                            Custom attributes will be stored as key-value pairs in
                                            JSON format. You can add these later through the
                                            organisation settings.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between mt-4 py-1 border-t ">
                        <Button
                            type="button"
                            className="cursor-pointer"
                            onClick={handleCancel}
                            variant={"outline"}
                            size={"sm"}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size={"sm"} className="cursor-pointer">
                            Create Organisation
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
};
