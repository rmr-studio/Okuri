import { useAuth } from "@/components/provider/AuthContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { updateUser } from "@/controller/user.controller";
import { User } from "@/lib/interfaces/user.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FC, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { isMobilePhone } from "validator";

import { z } from "zod";

const userOnboardDetailsSchema = z.object({
    displayName: z
        .string({ required_error: "Display Name is required" })
        .min(3, "Display Name is too short"),
    phone: z.string().min(10, "Invalid Phone Number").refine(isMobilePhone),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
    companyName: z.string().optional(),
    businessNumber: z.string().optional(),
    publicHolidayMultiplier: z.number().min(1, "Multiplier must be at least 1").optional(),
    saturdayMultiplier: z.number().min(1, "Multiplier must be at least 1").optional(),
    sundayMultiplier: z.number().min(1, "Multiplier must be at least 1").optional(),
    bsb: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
});

export type UserOnboard = z.infer<typeof userOnboardDetailsSchema>;

interface Props {
    user: User;
}

export const OnboardForm: FC<Props> = ({ user }) => {
    const { client, session } = useAuth();
    const queryClient = useQueryClient();
    const toastRef = useRef<string | number | null>(null);

    const userOnboardForm: UseFormReturn<UserOnboard> = useForm<UserOnboard>({
        resolver: zodResolver(userOnboardDetailsSchema),
        defaultValues: {
            displayName: user?.name || "",
            phone: user?.phone || undefined,
            street: user?.address?.street || "",
            city: user?.address?.city || "",
            state: user?.address?.state || "",
            country: user?.address?.country || "",
            postalCode: user?.address?.postalCode || "",
            companyName: user?.company?.name || "",
            businessNumber: user?.company?.abn || "",
            publicHolidayMultiplier: user?.chargeRate?.publicHolidayMultiplier || 1,
            saturdayMultiplier: user?.chargeRate?.saturdayMultiplier || 1,
            sundayMultiplier: user?.chargeRate?.sundayMultiplier || 1,
            bsb: user?.paymentDetails?.bsb || "",
            accountNumber: user?.paymentDetails?.accountNumber || "",
            accountName: user?.paymentDetails?.accountName || "",
        },
    });

    const userMutation = useMutation({
        mutationFn: (user: User) => updateUser(session, user),
        onMutate: () => {
            toastRef.current = toast.loading("Updating Profile...");
        },
        onError: (error: Error) => {
            console.error("Error updating user profile:", error);
            if (toastRef.current !== null) {
                toast.dismiss(toastRef.current);
            }

            toast.error("Failed to update Profile");
        },
        onSuccess: (response) => {
            if (toastRef.current !== null) {
                toast.dismiss(toastRef.current);
            }

            toast.success("Profile Updated Successfully");
            // Update profile cache
            queryClient.setQueryData(["userProfile", session?.user.id], response);
        },
    });

    const handleSubmission = async (values: UserOnboard) => {
        if (!user || !client) return;
        // Update User Profile
        const updatedUser: User = {
            ...user,
            phone: values.phone,
            name: values.displayName,
            address: {
                street: values.street,
                city: values.city,
                state: values.state,
                country: values.country,
                postalCode: values.postalCode,
            },
            company: {
                name: values.companyName,
                abn: values.businessNumber,
            },
            chargeRate: {
                publicHolidayMultiplier: values.publicHolidayMultiplier || 1,
                saturdayMultiplier: values.saturdayMultiplier || 1,
                sundayMultiplier: values.sundayMultiplier || 1,
            },
            paymentDetails: {
                bsb: values.bsb,
                accountNumber: values.accountNumber,
                accountName: values.accountName,
            },
        };

        userMutation.mutate(updatedUser);
    };

    return (
        <Form {...userOnboardForm}>
            <form onSubmit={userOnboardForm.handleSubmit(handleSubmission)}>
                <SheetTitle className="text-2xl mt-2 font-fold">Complete your profile</SheetTitle>
                <SheetDescription className="mt-2">
                    Please fill out the details below to complete your profile.
                    <br />
                    This will be used when generating invoices and other documents.
                </SheetDescription>
                <section className="mt-4 md:mt-0">
                    <FormField
                        control={userOnboardForm.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem className="mt-6">
                                <FormLabel className="font-semibold">Display Name *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="John Doe" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {/* <section className="flex flex-col md:flex-row md:space-x-4 mt-6">
                        <FormField
                            control={userOnboardForm.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="mt-8 md:mt-0 flex flex-col w-full">
                                    <FormLabel className="font-semibold">
                                        Phone Number
                                    </FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            {...field}
                                            defaultCountry="AU"
                                        />
                                    </FormControl>

                                    <FormMessage className="font-semibold" />
                                </FormItem>
                            )}
                        />
                    </section> */}
                </section>
                <SheetFooter className="justify-end flex flex-row px-0">
                    <Button className="w-32" type="submit">
                        Save
                    </Button>
                </SheetFooter>
            </form>
        </Form>
    );
};
