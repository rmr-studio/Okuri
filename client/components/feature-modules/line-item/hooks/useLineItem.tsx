"use client";

import { fetchOrganisationLineItems } from "@/components/feature-modules/line-item/controller/lineitem.controller";
import { useAuth } from "@/components/provider/auth-context";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { useQuery } from "@tanstack/react-query";
import { useOrganisation } from "../../../../hooks/useOrganisation";

export function useLineItem() {
    const { session, loading } = useAuth();
    const { data: organisation } = useOrganisation();

    const query = useQuery({
        queryKey: ["organisationLineItems", organisation?.id],
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

            return fetchOrganisationLineItems(session, organisation);
        },
        enabled: !!session?.user.id && !!organisation?.id, // Only fetch if user is authenticated and if an organisation is available
        retry: (count, error) => {
            if (isResponseError(error)) return false;
            return count < 2;
        },
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        isLoadingAuth: loading,
    };
}
