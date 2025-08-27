import { useAuth } from "@/components/provider/AuthContext";
import { getOrganisationWithMembers } from "@/controller/organisation.controller";
import { OrganisationMember } from "@/lib/interfaces/organisation.interface";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export type OrganisationRole = "OWNER" | "ADMIN" | "MEMBER";

export interface UseOrganisationRoleReturn {
    isLoadingAuth: boolean;
    isLoading: boolean;
    error: Error | null;
    role: OrganisationRole | null;
    member: OrganisationMember | null;
    organisation: any | null;
    isOwner: boolean;
    isAdmin: boolean;
    isMember: boolean;
    hasRole: (role: OrganisationRole) => boolean;
}

/**
 * Hook to fetch the current user's role within an organisation
 *
 * This hook fetches organisation data including all members and extracts
 * the current user's role from the members list. It provides convenient
 * boolean flags and helper functions for role checking.
 *
 * @example
 * ```tsx
 * const { role, isAdmin, hasRole, isLoading } = useOrganisationRole();
 *
 * if (isLoading) return <div>Loading...</div>;
 *
 * if (isAdmin) {
 *   return <AdminPanel />;
 * }
 *
 * if (hasRole("MEMBER")) {
 *   return <MemberView />;
 * }
 * ```
 *
 * @returns Object containing role information and helper functions
 */
export const useOrganisationRole = (): UseOrganisationRoleReturn => {
    const { session, loading } = useAuth();
    const { id: orgId } = useParams<{ id: string }>();

    // Use TanStack Query to fetch organization data with members
    const query = useQuery({
        queryKey: ["organization-with-members", orgId],
        queryFn: () =>
            getOrganisationWithMembers(session, { organisationId: orgId }),
        enabled: !!orgId && !!session?.user.id,
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Extract current user's role from members
    const currentUserMember = query.data?.members?.find(
        (member) => member.user.id === session?.user.id
    );

    const role: OrganisationRole | null = currentUserMember?.role || null;

    // Helper functions for role checking
    const isOwner = role === "OWNER";
    const isAdmin = role === "ADMIN" || role === "OWNER";
    const isMember = role === "MEMBER" || role === "ADMIN" || role === "OWNER";

    /**
     * Check if the current user has at least the specified role level
     * Role hierarchy: MEMBER < ADMIN < OWNER
     *
     * @param requiredRole - The minimum role level required
     * @returns true if user has the required role or higher
     */
    const hasRole = (requiredRole: OrganisationRole): boolean => {
        if (!role) return false;

        const roleHierarchy: Record<OrganisationRole, number> = {
            MEMBER: 1,
            ADMIN: 2,
            OWNER: 3,
        };

        return roleHierarchy[role] >= roleHierarchy[requiredRole];
    };

    return {
        isLoadingAuth: loading,
        isLoading: query.isLoading,
        error: query.error,
        role,
        member: currentUserMember || null,
        organisation: query.data || null,
        isOwner,
        isAdmin,
        isMember,
        hasRole,
    };
};
