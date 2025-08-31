import { useAuth } from "@/components/provider/auth-context";
import {
    getOrganisation,
    getOrganisationInvites,
    inviteToOrganisation,
    revokeInvite,
} from "@/controller/organisation.controller";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export const useOrganisation = () => {
    const { session, loading } = useAuth();
    // Extract organization name from URL params
    // Assuming the route is defined like: /dashboard/organisation/:organisationId
    const { organisationId } = useParams<{ organisationId: string }>();

    // Use TanStack Query to fetch organization data
    const query = useQuery({
        queryKey: ["organisation", organisationId], // Unique key for caching
        queryFn: () => getOrganisation(session, { organisationId }, true), // Fetch function with members
        enabled: !!organisationId && !!session?.user.id, // Only fetch if orgName exists and the user is authenticated
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return { isLoadingAuth: loading, ...query };
};

export const useOrganisationInvites = () => {
    const { session } = useAuth();
    const { organisationId } = useParams<{ organisationId: string }>();

    return useQuery({
        queryKey: ["organisation-invites", organisationId],
        queryFn: () => getOrganisationInvites(session, { organisationId }),
        enabled: !!organisationId && !!session?.user.id,
        retry: 1,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    });
};

export const useInviteToOrganisation = () => {
    const { session } = useAuth();
    const { organisationId } = useParams<{ organisationId: string }>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            email,
            role,
        }: {
            email: string;
            role: "OWNER" | "ADMIN" | "MEMBER";
        }) => inviteToOrganisation(session, { organisationId, email, role }),
        onSuccess: () => {
            toast.success("Invitation sent successfully!");
            // Invalidate and refetch invites
            queryClient.invalidateQueries({
                queryKey: ["organisation-invites", organisationId],
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to send invitation");
        },
    });
};

export const useRevokeInvite = () => {
    const { session } = useAuth();
    const { organisationId } = useParams<{ organisationId: string }>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string }) =>
            revokeInvite(session, { organisationId, id }),
        onSuccess: () => {
            toast.success("Invitation revoked successfully!");
            // Invalidate and refetch invites
            queryClient.invalidateQueries({
                queryKey: ["organisation-invites", organisationId],
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to revoke invitation");
        },
    });
};
