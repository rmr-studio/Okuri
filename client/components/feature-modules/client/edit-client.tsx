import { useAuth } from "@/components/provider/auth-context";
import { useClient } from "@/hooks/useClient";
import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";
import { ClientCreation, ClientForm } from "./form/client-form";
import { mockClientTemplate } from "./new-client";

// TODO: TEMPLATE INTEGRATION

const EditClient: FC = () => {
    const { session } = useAuth();
    const { data: client, isPending, isLoadingAuth, error } = useClient();
    const router = useRouter();

    /**
     * Handle Form Submission (Form should validate data)
     *  1. call Client update mutation
     *  2. clear client cache
     *  3. redirect to client detail page
     */
    const onEdit = async (client: ClientCreation) => {};

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
    return (
        <ClientForm
            templates={[mockClientTemplate]}
            selectedTemplate={mockClientTemplate}
            client={client}
            onSubmit={onEdit}
        />
    );
};

export default EditClient;
