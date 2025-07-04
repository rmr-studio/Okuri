"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { fetchUserLineItems } from "@/controller/lineitem.controller";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { useQuery } from "@tanstack/react-query";

export function useLineItem() {
    const { session, loading } = useAuth();

    const query = useQuery({
        queryKey: ["userLineItems", session?.user.id],
        queryFn: () => {
            if (!session?.user.id) {
                throw fromError({
                    message: "No active session found",
                    status: 401,
                    error: "NO_SESSION",
                });
            }
            return fetchUserLineItems(session);
        },
        enabled: !!session?.user.id,
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
