import { OrganisationRole } from "@/components/feature-modules/organisation/interface/organisation.interface";
import { useAuth } from "@/components/provider/auth-context";
import { useOrganisation } from "./use-organisation";

interface UseOrganisationRoleReturn {
    isLoading: boolean;
    error: Error | null;
    role: OrganisationRole | null;
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
    const { data: organisation, isPending, isLoadingAuth, error } = useOrganisation();

    // Extract current user's role from members. Given the organisation can be fetched, and the user is apart of that organisation,
    const role: OrganisationRole | null =
        organisation?.members?.find((member) => member.user.id === session?.user.id)
            ?.membershipDetails.role ?? null;

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
        isLoading: isPending || isLoadingAuth || loading,
        error,
        role,
        hasRole,
    };
};
