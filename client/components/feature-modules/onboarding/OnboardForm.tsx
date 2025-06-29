import { useAuth } from "@/components/provider/AuthContext";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { updateUser } from "@/controller/user.controller";
import { useProfile } from "@/hooks/useProfile";
import { Propless } from "@/lib/interfaces/interface";
import { User } from "@/lib/interfaces/user.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FC, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { isMobilePhone } from "validator";

import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import OnboardUserForm from "./form/1.User";
import OnboardCompanyForm from "./form/2.Company";

const userOnboardDetailsSchema = z.object({
    displayName: z
        .string({ required_error: "Display Name is required" })
        .min(3, "Display Name is too short"),
    phone: z.string().min(10, "Invalid Phone Number").refine(isMobilePhone),
    street: z
        .string({ required_error: "Street is required" })
        .nonempty("A street address is required"),
    city: z.string({ required_error: "City is required" }).nonempty("A city is required"),
    state: z.string({ required_error: "State is required" }).nonempty("A state is required"),
    country: z.string({ required_error: "Country is required" }).nonempty("A country is required"),
    postalCode: z
        .string({ required_error: "Postal Code is required" })
        .nonempty("A postal code is required"),

    companyName: z.string().optional(),
    businessNumber: z.string().optional(),
    publicHolidayMultiplier: z.coerce.number().min(1, "Multiplier must be at least 1").optional(),
    saturdayMultiplier: z.coerce.number().min(1, "Multiplier must be at least 1").optional(),
    sundayMultiplier: z.coerce.number().min(1, "Multiplier must be at least 1").optional(),
    bsb: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
});

export type UserOnboard = z.infer<typeof userOnboardDetailsSchema>;

type OnboardFormTab = "user" | "company";

export const OnboardForm: FC<Propless> = () => {
    const { client, session } = useAuth();
    const { data: user } = useProfile();
    const queryClient = useQueryClient();
    const [progress, setProgress] = useState<number>(20);
    const [currentTab, setCurrentTab] = useState<OnboardFormTab>("user");
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

    const handleNextTab = async () => {
        if (currentTab === "user") {
            const tabValidation = await userOnboardForm.trigger([
                "displayName",
                "phone",
                "street",
                "city",
                "state",
                "country",
                "postalCode",
            ]);

            if (!tabValidation) return;

            setCurrentTab("company");
            setProgress(100);
        } else {
            const tabValidation = await userOnboardForm.trigger([
                "companyName",
                "businessNumber",
                "publicHolidayMultiplier",
                "saturdayMultiplier",
                "sundayMultiplier",
                "bsb",
                "accountNumber",
                "accountName",
            ]);

            if (!tabValidation) return;

            handleSubmission(userOnboardForm.getValues());
        }
    };

    return (
        <Form {...userOnboardForm}>
            <form onSubmit={userOnboardForm.handleSubmit(handleSubmission)}>
                <SheetTitle className="text-2xl mt-2 font-bold">Complete your profile</SheetTitle>
                <Progress value={progress} className="my-4" />
                <SheetDescription className="mt-2">
                    Please fill out the details below to complete your profile.
                    <br />
                    This will be used when generating invoices and other documents.
                    <br />
                </SheetDescription>
                <div className="mt-4 italic text-sm text-muted-foreground">
                    <span className="font-semibold">Note:</span> You can update these details later
                    in your profile settings.
                </div>
                <div className="mt-4">
                    {currentTab === "user" && <OnboardUserForm {...userOnboardForm} />}
                    {currentTab === "company" && <OnboardCompanyForm {...userOnboardForm} />}
                </div>

                <SheetFooter className="justify-end flex flex-row px-0">
                    <Button className="w-32 cursor-pointer" type="button" onClick={handleNextTab}>
                        {currentTab === "user" ? "Next" : "Submit"}
                    </Button>
                </SheetFooter>
            </form>
        </Form>
    );
};
