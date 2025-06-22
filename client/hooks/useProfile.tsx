"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { fetchSessionUser } from "@/controller/user.controller";
import { useQuery } from "@tanstack/react-query";

export function useProfile() {
    const { session, loading } = useAuth();

    const query = useQuery({
        queryKey: ["userProfile", session?.user.id],
        queryFn: () => fetchSessionUser(session),
        enabled: !!session?.user.id, // Only fetch if user is authenticated
        retry: 1, // Retry once on failure
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes,
    });

    return {
        ...query,
        isLoadingAuth: loading,
    };
}
