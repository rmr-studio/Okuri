import { useAuth } from "@/components/provider/auth-context";
import { updateClient } from "@/controller/client.controller";
import { useClient } from "@/hooks/useClient";
import { UpdateClientRequest } from "@/lib/interfaces/client.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FC, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ClientCreation, ClientForm } from "./form/client-form";
import { mockClientTemplate } from "./new-client";

const EditClient: FC = () => {
    const { session } = useAuth();
    const { data: client, isPending, isLoadingAuth, error } = useClient();
    const router = useRouter();
    const toastRef = useRef<string | number | undefined>(undefined);
    const queryClient = useQueryClient();

    /**
     * Handle Form Submission (Form should validate data)
     *  1. call Client update mutation
     *  2. clear client cache
     *  3. redirect to client detail page
     */
    const onEdit = async (client: ClientCreation) => {};

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

    const loading = isPending || isLoadingAuth;

    /**
     * Effect to handle redirection if client is not found or error occurs
     */
    useEffect(() => {
        if (!loading && !client) {
            // If there's an error, redirect with error message
            if (error) {
                router.push(`/dashboard/clients?error=${error}`);
                return;
            }

            router.push("/dashboard/clients");
        }
    }, [loading, error, client, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!client) return;

    if (!session || !client) return null;
    return <ClientForm selectedTemplate={mockClientTemplate} client={client} onSubmit={onEdit} />;
};

export default EditClient;
