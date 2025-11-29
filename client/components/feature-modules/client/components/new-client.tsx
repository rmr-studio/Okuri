"use client";

import {
    Client,
    ClientCreationRequest,
} from "@/components/feature-modules/client/interface/client.interface";
import { useAuth } from "@/components/provider/auth-context";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOrganisation } from "../../organisation/hooks/use-organisation";
import { ClientCreation, ClientForm } from "../form/client-form";
import { createClient } from "../service/client.service";

const NewClient = () => {
    const { session } = useAuth();
    const { data: organisation, isPending, isLoadingAuth, error } = useOrganisation();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();
    const queryClient = useQueryClient();

    // TODO: Ability to fetch available templates and select one to shape form schema
    const loading = isPending || isLoadingAuth;

    useEffect(() => {
        if (!loading && !organisation) {
            // If there's an error, redirect with error message
            if (error) {
                router.push(`/dashboard/organisation?error=${error}`);
                return;
            }

            router.push("/dashboard/organisation");
        }
    }, [loading, error, organisation, router]);

    // TODO: Handle Cancelation and breadcumbs
    const handleCancel = () => {
        if (organisation?.id) router.push(`/dashboard/organisation/${organisation.id}/clients`);
        else router.push(`/dashboard/organisation`);
    };

    const onSubmit = async (data: ClientCreation) => {
        if (!organisation?.id) return;

        // TODO: Add link to template if one was selected or if one was extended/created and saved

        const client: ClientCreationRequest = {
            name: data.name,
            organisationId: organisation.id,
            contact: {
                email: data.contact.email,
                phone: data.contact.phone,
                address: data.contact.address,
            },
        };

        createClientMutation(client);
    };
    const { mutate: createClientMutation } = useMutation({
        mutationFn: (client: ClientCreationRequest) => createClient(session, client),
        onMutate: () => {
            toastRef.current = toast.loading("Creating New Client...");
        },
        onSuccess: (client: Client) => {
            toast.dismiss(toastRef.current);
            toast.success("Client created successfully");

            if (!organisation) {
                router.push("/dashboard/organisation");
                return;
            }

            // Invalidate Organisation client list
            queryClient.invalidateQueries({
                queryKey: ["organisation", organisation.id, "clients"],
            });

            router.push(`/dashboard/organisation/${organisation.id}/clients/${client.id}`);
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create client: ${error.message}`);
        },
    });

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisations", truncate: true },
        {
            label: organisation?.name || "Organisation",
            href: `/dashboard/organisation/${organisation?.id}/clients`,
        },
        {
            label: "Clients",
            href: `/dashboard/organisation/${organisation?.id}/clients/`,
        },
        { label: "New", href: "#", active: true },
    ];

    return (
        <ClientForm
            className="m-8"
            renderHeader={() => (
                <>
                    <BreadCrumbGroup items={trail} className="mb-4" />
                    <h1 className="text-xl font-bold text-primary mb-2">Create New Client</h1>
                    <p className="text-muted-foreground text-sm">
                        Set up your client profile in just a few steps. This will help your team
                        identify and manage client relationships effectively.
                    </p>
                </>
            )}
            onSubmit={onSubmit}
        />
    );
};

export default NewClient;
