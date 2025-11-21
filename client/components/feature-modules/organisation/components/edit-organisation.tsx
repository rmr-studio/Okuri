"use client";

import { Organisation } from "@/components/feature-modules/organisation/interface/organisation.interface";
import { updateOrganisation } from "@/components/feature-modules/organisation/service/organisation.service";
import { useAuth } from "@/components/provider/auth-context";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useOrganisation } from "../hooks/useOrganisation";
import { useOrganisationRole } from "../hooks/useOrganisationRole";
import { OrganisationForm, OrganisationFormDetails } from "./form/organisation-form";

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

    const handleSubmission = async (values: OrganisationFormDetails) => {
        if (!session || !client) {
            toast.error("No active session found");
            return;
        }

        if (!organisation) {
            toast.error("Organisation not found");
            return;
        }

        const updatedOrganisation: Organisation = {
            ...organisation,
            ...values,
            defaultCurrency: { currencyCode: values.defaultCurrency },
            organisationPaymentDetails: {
                ...values.payment,
            },
            customAttributes: values.customAttributes,
        };

        // Create the organisation
        organisationMutation.mutate(updatedOrganisation);
    };

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisations", truncate: true },
        {
            label: organisation?.name || "Organisation",
            href: `/dashboard/organisation/${organisation?.id}/clients`,
        },
        { label: "Edit", href: "#", active: true },
    ];

    if (!session || !organisation) return null;
    return (
        <OrganisationForm
            className="m-8"
            onSubmit={handleSubmission}
            organisation={organisation}
            setUploadedAvatar={setUploadedAvatar}
            renderHeader={() => (
                <>
                    <BreadCrumbGroup items={trail} className="mb-4" />
                    <h1 className="text-xl font-bold text-primary mb-2">
                        Manage {organisation?.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Set up your organisation in just a few steps. This will help manage and
                        store all important information you need when managing and invoicing your
                        clients.
                    </p>
                </>
            )}
        />
    );
};

export default EditOrganisation;
