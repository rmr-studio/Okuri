import { useAuth } from "@/components/provider/AuthContext";
import { AvatarUploader } from "@/components/ui/avatar-uploader";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    SheetDescription,
    SheetFooter,
    SheetTitle,
} from "@/components/ui/sheet";
import { updateUser } from "@/controller/user.controller";
import { useProfile } from "@/hooks/useProfile";
import { User } from "@/lib/interfaces/user.interface";
import { OTPFormSchema } from "@/lib/util/form/form.util";
import {
    formatURLPath,
    handlePublicFileUpload,
} from "@/lib/util/storage/storage.util";
import { undefinedIfNull } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { isMobilePhone } from "validator";

import { z } from "zod";

const userOnboardDetailsSchema = z.object({
    displayName: z
        .string({ required_error: "Display Name is required" })
        .min(3, "Display Name is too short"),
    phone: z
        .string()
        .min(10, "Invalid Phone Number")
        .refine(isMobilePhone)
        .optional()
        .or(z.literal("")),
    avatarUrl: z.string().url().optional(),

    // OTP is only required if phone number is provided
    otp: OTPFormSchema.shape.otp.or(z.literal("")),
});

export type UserOnboard = z.infer<typeof userOnboardDetailsSchema>;

export const OnboardForm = () => {
    const { data: user } = useProfile();
    const { client, session } = useAuth();
    const queryClient = useQueryClient();

    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);
    const toastRef = useRef<string | number | null>(null);

    const userOnboardForm: UseFormReturn<UserOnboard> = useForm<UserOnboard>({
        resolver: zodResolver(userOnboardDetailsSchema),
        defaultValues: {
            displayName: user?.name || "",
            phone: user?.phone || undefined,
            avatarUrl: user?.avatarUrl,
            otp: "",
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
            queryClient.setQueryData(
                ["userProfile", session?.user.id],
                response
            );
        },
    });

    const handleSubmission = async (values: UserOnboard) => {
        if (!user || !client) return;

        if (uploadedAvatar) {
            const loadingToast = toast.loading("Uploading Avatar...");
            const response = await handlePublicFileUpload(
                client,
                uploadedAvatar!,
                "profile-picture",
                user.id,
                true
            );

            toast.dismiss(loadingToast);

            if (!response.ok) {
                toast.error("Failed to upload Avatar");
                return;
            }
        }

        // Update User Profile
        const updatedUser: User = {
            ...user,
            phone: undefinedIfNull(values.phone),
            name: values.displayName,
            avatarUrl: uploadedAvatar
                ? formatURLPath("profile-picture", user.id)
                : values.avatarUrl,
        };

        userMutation.mutate(updatedUser);
    };

    const handleAvatarUpload = async (image: File): Promise<void> => {
        // Store transformed image ready for upload upon form submission
        setUploadedAvatar(image);
        // Set the avatar URL in the form state
        const avatarURL = URL.createObjectURL(image);
        userOnboardForm.setValue("avatarUrl", avatarURL);
    };

    const handleAvatarRemoval = (): void => {
        setUploadedAvatar(null);
        userOnboardForm.setValue("avatarUrl", undefined);
    };

    return (
        <Form {...userOnboardForm}>
            <form onSubmit={userOnboardForm.handleSubmit(handleSubmission)}>
                <SheetTitle className="text-2xl mt-2 font-fold">
                    Complete your profile
                </SheetTitle>
                <SheetDescription className="mt-2">
                    Please fill out the details below to complete your profile.
                </SheetDescription>
                <section className="mt-4 md:mt-0">
                    <FormLabel className="pb-0 md:hidden font-semibold">
                        Profile Picture
                    </FormLabel>
                    <AvatarUploader
                        onUpload={handleAvatarUpload}
                        imageURL={userOnboardForm.getValues("avatarUrl")}
                        onRemove={handleAvatarRemoval}
                    />

                    <FormField
                        control={userOnboardForm.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem className="mt-6">
                                <FormLabel className="font-semibold">
                                    Display Name *
                                </FormLabel>
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
