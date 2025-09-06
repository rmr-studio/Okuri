"use client";

import { useAuth } from "@/components/provider/auth-context";
import { fetchOrganisationClients } from "@/controller/client.controller";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { useQuery } from "@tanstack/react-query";
import { useOrganisation } from "./useOrganisation";

export function useOrganisationClients() {
    const { session, loading } = useAuth();

    // Fetch current organisationId from parametres
    const { data: organisation } = useOrganisation();

    const query = useQuery({
        queryKey: ["organisation", organisation?.id, "clients"],
        queryFn: () => {
            if (!session?.user.id) {
                throw fromError({
                    message: "No active session found",
                    status: 401,
                    error: "NO_SESSION",
                });
            }

            if (!organisation?.id) {
                throw fromError({
                    message: "No organisation found",
                    status: 404,
                    error: "NO_ORGANISATION",
                });
            }

            return fetchOrganisationClients(session, organisation);
        },
        enabled: !!session?.user.id && !!organisation?.id, // Only fetch if user is authenticated and if an organisation is available
        retry: (count, error) => {
            // Retry once on failure, but not on network errors
            if (isResponseError(error)) return false;

            return count < 2;
        }, // Retry once on failure
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes,
    });

    return {
        ...query,
        isLoadingAuth: loading,
    };
}
