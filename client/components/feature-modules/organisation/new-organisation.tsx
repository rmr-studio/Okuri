"use client`";

import { useAuth } from "@/components/provider/auth-context";
import { createOrganisation } from "@/controller/organisation.controller";
import { useProfile } from "@/hooks/useProfile";
import { OrganisationCreationRequest } from "@/lib/interfaces/organisation.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
    OrganisationCreation,
    OrganisationForm,
} from "./form/organisation-form";

const NewOrganisation = () => {
    const { session, client } = useAuth();
    const { data: user } = useProfile();
    const queryClient = useQueryClient();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();
    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);

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

    return (
        <div>
            <OrganisationForm
                onSubmit={handleSubmission}
                setUploadedAvatar={setUploadedAvatar}
            />
        </div>
    );
};

export default NewOrganisation;
