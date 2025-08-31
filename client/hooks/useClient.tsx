import { useAuth } from "@/components/provider/auth-context";
import { getClient } from "@/controller/client.controller";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export const useClient = () => {
    const { session, loading } = useAuth();
    // Extract organization name from URL params
    // Assuming the route is defined like: /dashboard/clients/:id
    const { id } = useParams<{ id: string }>();

    // Use TanStack Query to fetch organization data
    const query = useQuery({
        queryKey: ["client", id], // Unique key for caching
        queryFn: () => getClient(session, { clientId: id }), // Fetch function
        enabled: !!id && !!session?.user.id, // Only fetch if orgName exists and the user is authenticated
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return { isLoadingAuth: loading, ...query };
};
