"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { AvatarUploader } from "@/components/ui/avatar-uploader";
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
import {
    OrganisationCreationRequest,
    OrganisationMember,
} from "@/lib/interfaces/organisation.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SquareArrowOutUpRight } from "lucide-react";
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
    avatarUrl: z.string().url().optional(),
    isDefault: z.boolean(),
});

export type OrganisationCreation = z.infer<typeof OrganisationCreationFormSchema>;
export type OrganisationFormTab = "base" | "address" | "billing";

export const OrganisationForm = () => {
    const { session, client } = useAuth();
    const { data: user } = useProfile();
    const progress = useState<number>(20);
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();

    const queryClient = useQueryClient();

    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);
    const handleSubmission = async (values: OrganisationCreation) => {
        if (!session || !client) return;

        const organisation: OrganisationCreationRequest = {
            name: values.displayName,
            avatarUrl: values.avatarUrl,
            isDefault: values.isDefault,
        };

        // Create the organisation
        organisationMutation.mutate(organisation);
    };

    const organisationCreationForm: UseFormReturn<OrganisationCreation> =
        useForm<OrganisationCreation>({
            resolver: zodResolver(OrganisationCreationFormSchema),
            defaultValues: {
                displayName: "",
                plan: "ENTHUSIAST", // Default plan
                avatarUrl: undefined, // No avatar by default
                isDefault: user?.memberships.length === 0, // Default to false unless user has no memberships
            },
        });

    const organisationMutation = useMutation({
        mutationFn: (organisation: OrganisationCreationRequest) =>
            createOrganisation(session, organisation),
        onMutate: () => {
            toastRef.current = toast.loading("Creating Organisation...");
        },
        onSuccess: (organisation) => {
            toast.dismiss(toastRef.current);
            toast.success("Organisation created successfully");

            if (!user) {
                router.push("/dashboard/organisation");
                return;
            }

            const member: OrganisationMember = {
                organisationId: organisation.id,
                organisation: organisation,
                user,
                role: "OWNER",
                memberSince: new Date().toISOString(),
            };

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

    const handleAvatarUpload = async (image: File): Promise<void> => {
        // Store transformed image ready for upload upon form submission
        setUploadedAvatar(image);
        // Set the avatar URL in the form state
        const avatarURL = URL.createObjectURL(image);
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
                                                <SquareArrowOutUpRight className="w-3 h-3 ml-1" />
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
                                                <SelectItem value="ENTHUSIAST">
                                                    Enthusiast
                                                </SelectItem>
                                                <SelectItem value="PRO">Pro</SelectItem>
                                                <SelectItem value="TEAM">Team</SelectItem>
                                            </SelectContent>
                                        </Select>
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
