import { useAuth } from "@/components/provider/AuthContext";
import { getOrganisation } from "@/controller/organisation.controller";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export const useOrganisation = () => {
    const { session, loading } = useAuth();
    // Extract organization name from URL params
    // Assuming the route is defined like: /dashboard/organisation/:orgId
    const { id: orgId } = useParams<{ id: string }>();

    // Use TanStack Query to fetch organization data
    const query = useQuery({
        queryKey: ["organization", orgId], // Unique key for caching
        queryFn: () => getOrganisation(session, orgId), // Fetch function
        enabled: !!orgId && !!session?.user.id, // Only fetch if orgName exists and the user is authenticated
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return { isLoadingAuth: loading, ...query };
};
