import { getOrganisation } from "@/components/feature-modules/organisation/service/organisation.service";
import { useAuth } from "@/components/provider/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export const useOrganisation = () => {
    const { session, loading } = useAuth();
    // Extract organization name from URL params
    // Assuming the route is defined like: /dashboard/organisation/:organisationId
    const { organisationId } = useParams<{ organisationId: string }>();

    // Use TanStack Query to fetch organization data
    const query = useQuery({
        queryKey: ["organisation", organisationId], // Unique key for caching
        queryFn: () => getOrganisation(session, { organisationId }, true), // Fetch function with all associatedMetadata
        enabled: !!organisationId && !!session?.user.id, // Only fetch if orgName exists and the user is authenticated
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return { isLoadingAuth: loading, ...query };
};
