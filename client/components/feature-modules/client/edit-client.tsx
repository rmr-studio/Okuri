"use client";

import { useAuth } from "@/components/provider/auth-context";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { updateClient } from "@/controller/client.controller";
import { useClient } from "@/hooks/useClient";
import { useOrganisation } from "@/hooks/useOrganisation";
import { UpdateClientRequest } from "@/lib/interfaces/client.interface";
import { isResponseError } from "@/lib/util/error/error.util";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FC, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ClientCreation, ClientForm } from "./form/client-form";
import { mockClientTemplate } from "./new-client";

const EditClient: FC = () => {
    const { session } = useAuth();
    const { data: organisation, isPending: isFetchingOrg, error: orgError } = useOrganisation();
    const {
        data: client,
        isPending: isFetchingClient,
        isLoadingAuth,
        error: clientError,
    } = useClient();
    const router = useRouter();
    const toastRef = useRef<string | number | undefined>(undefined);
    const queryClient = useQueryClient();

    const loading = isFetchingClient || isFetchingOrg || isLoadingAuth;

    //TODO: FIGURE OUT A WAY TO SCALE THIS INTO A REUSABLE HOOK FOR ALL COMPONENTS

    /**
     * Effect to handle redirection if client is not found or error occurs
     */
    useEffect(() => {
        if (!loading && !client) {
            if (
                (!clientError || isResponseError(!clientError)) &&
                (!orgError || isResponseError(orgError))
            ) {
                // If no specific error, redirect to general clients page
                router.push("/dashboard/organisations");
                return;
            }

            if (orgError && isResponseError(orgError)) {
                router.push(`/dashboard/organisations?error=${orgError.error}`);
                return;
            }

            if (clientError && isResponseError(clientError)) {
                if (!organisation) {
                    router.push("/dashboard/organisations");
                    return;
                }

                router.push(
                    `/dashboard/organisation/${organisation.id}/clients?error=${clientError.error}`
                );
                return;
            }
        }
    }, [loading, clientError, orgError, client, router]);

    /**
     * Handle Form Submission (Form should validate data)
     *  1. call Client update mutation
     *  2. clear client cache
     *  3. redirect to client detail page
     */
    const onEdit = async (updatedClient: ClientCreation) => {
        if (!session || !client) return;

        const updateClientRequest: UpdateClientRequest = {
            ...client,
            ...updatedClient,
        };

        editMutation.mutate(updateClientRequest);
    };

    const editMutation = useMutation({
        mutationFn: (client: UpdateClientRequest) => updateClient(session, client),
        onMutate: () => {
            toastRef.current = toast.loading("Updating Client Details...");
        },
        onSuccess: (_) => {
            toast.dismiss(toastRef.current);
            toast.success("Client updated successfully");

            if (!client) {
                router.push("/dashboard/clients");
                return;
            }

            // Invalidate Client detail query
            queryClient.invalidateQueries({
                queryKey: ["client", client.id],
            });

            // Invalidate Organisation client list
            queryClient.invalidateQueries({
                queryKey: ["organisation", client.organisationId, "clients"],
            });

            // Navigate back to Client Overview page
            router.push(`/dashboard/organisation/${client.organisationId}/clients/${client.id}`);
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create organisation: ${error.message}`);
        },
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!session || !client) return null;

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisations", truncate: true },
        {
            label: organisation?.name || "Organisation",
            href: `/dashboard/organisation/${organisation?.id}/clients`,
            truncate: true,
        },
        {
            label: client.name || "Client",
            href: `/dashboard/organisation/${organisation?.id}/clients/${client.id}`,
        },
        { label: "Edit", href: "#", active: true },
    ];

    
    return (
        <ClientForm
            className="m-8"
            renderHeader={() => (
                <>
                    <BreadCrumbGroup items={trail} className="mb-4" />
                    <h1 className="text-xl font-bold text-primary mb-2">Manage {client.name}</h1>
                    <p className="text-muted-foreground text-sm">
                        Set up your client profile in just a few steps. This will help your team
                        identify and manage client relationships effectively.
                    </p>
                </>
            )}
            selectedTemplate={mockClientTemplate}
            client={client}
            onSubmit={onEdit}
        />
    );
};

export default EditClient;
