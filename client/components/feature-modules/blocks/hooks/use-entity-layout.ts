import { useAuth } from "@/components/provider/auth-context";
import { EntityType } from "@/lib/types/types";
import { useQuery } from "@tanstack/react-query";
import { type BlockEnvironment } from "../interface/block.interface";
import { LayoutService } from "../service/layout.service";

/**
 * Hook to load and manage block environment for an entity.
 *
 * Uses React Query for caching and state management.
 * Automatically handles authentication and loading states.
 *
 * @param entityId - UUID of the entity (client, organisation, etc.)
 * @param entityType - Type of entity (CLIENT, ORGANISATION, PROJECT, INVOICE)
 * @returns Block environment data, loading state, error, and refetch function
 *
 * @example
 * const { environment, isLoading, error, refetch } = useEntityLayout(
 *   clientId,
 *   EntityType.CLIENT
 * );
 */
export interface UseEntityLayoutResult {
    environment?: BlockEnvironment;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<unknown>;
}

export const useEntityLayout = (
    organisationId: string | undefined,
    entityId: string | undefined,
    entityType: EntityType
): UseEntityLayoutResult => {
    const { session, loading: authLoading } = useAuth();

    const query = useQuery<BlockEnvironment, Error>({
        queryKey: ["layout", organisationId, entityType, entityId],
        queryFn: () => LayoutService.loadLayout(session, organisationId, entityId, entityType),
        enabled: !!organisationId && !!entityId && !!session && !authLoading,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    });

    return {
        environment: query.data,
        isLoading: query.isLoading || authLoading,
        error: query.error,
        refetch: query.refetch,
    };
};
