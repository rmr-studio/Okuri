"use client";

import { useAuth } from "@/components/provider/auth-context";
import { updateOrganisation } from "@/controller/organisation.controller";
import { useOrganisation } from "@/hooks/useOrganisation";
import { useOrganisationRole } from "@/hooks/useOrganisationRole";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const EditOrganisation = () => {
    const { session, client } = useAuth();
    const { data: organisation } = useOrganisation();
    const { role, hasRole, isLoading, error } = useOrganisationRole();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();
    const [uploadedAvatar, setUploadedAvatar] = useState<Blob | null>(null);
    const queryClient = useQueryClient();

    const organisationMutation = useMutation({
        mutationFn: (organisation: Organisation) =>
            updateOrganisation(session, organisation, uploadedAvatar),
        onMutate: () => {
            toastRef.current = toast.loading("Creating Organisation...");
        },
        onSuccess: (_) => {
            toast.dismiss(toastRef.current);
            toast.success("Organisation created successfully");

            if (!organisation) {
                router.push("/dashboard/organisation");
                return;
            }

            // Update user profile with new organisation
            queryClient.invalidateQueries({
                queryKey: ["organisation", organisation.id],
            });

            router.push("/dashboard/organisation");
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create organisation: ${error.message}`);
        },
    });

    const handleSubmission = async (values: Organisation) => {
        if (!session || !client) {
            toast.error("No active session found");
            return;
        }

        // Create the organisation
        organisationMutation.mutate(organisation);
    };

    return <div></div>;
};

export default EditOrganisation;
