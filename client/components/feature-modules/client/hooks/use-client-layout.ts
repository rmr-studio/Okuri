import { useEntityLayout } from "@/components/feature-modules/blocks/hooks/use-entity-layout";
import { EntityType } from "@/components/feature-modules/blocks/interface/layout.interface";

/**
 * Hook to load and manage block environment for a client entity.
 *
 * This is a convenience wrapper around useEntityLayout specifically for clients.
 * Automatically sets the entity type to CLIENT.
 *
 * @param clientId - UUID of the client
 * @returns Block environment data, loading state, error, and refetch function
 *
 * @example
 * const { environment, isLoading, error } = useClientLayout(clientId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Alert>{error.message}</Alert>;
 *
 * return <EntityBlockEnvironment environment={environment} />;
 */
export const useClientLayout = (clientId: string | undefined) => {
    return useEntityLayout(clientId, EntityType.CLIENT);
};
