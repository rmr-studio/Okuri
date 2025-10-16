import { getClient } from "@/components/feature-modules/client/controller/client.controller";
import { useAuth } from "@/components/provider/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export const useClient = () => {
    const { session, loading } = useAuth();
    // Extract organization name from URL params
    // Assuming the route is defined like: /dashboard/clients/:clientId
    const { clientId } = useParams<{ clientId: string }>();

    // Use TanStack Query to fetch organization data
    const query = useQuery({
        queryKey: ["client", clientId], // Unique key for caching
        queryFn: () => getClient(session, { clientId }), // Fetch function
        enabled: !!clientId && !!session?.user.id, // Only fetch if orgName exists and the user is authenticated
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return { isLoadingAuth: loading, ...query };
};
