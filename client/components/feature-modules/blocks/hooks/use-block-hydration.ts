import { useAuth } from "@/components/provider/auth-context";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { BlockHydrationResult, BlockService } from "../service/block.service";

/**
 * Hook to hydrate (resolve entity references for) a single block.
 *
 * Uses React Query for caching and state management.
 * Automatically handles authentication and loading states.
 *
 * This hook implements progressive loading - blocks are hydrated on-demand
 * rather than all at once during initial page load.
 *
 * @param blockId - UUID of the block to hydrate
 * @param organisationId - Organisation context for authorization
 * @returns Hydration result with resolved entity references, loading state, and error
 *
 * @example
 * const { data: hydrationResult, isLoading, error } = useBlockHydration(
 *   "block-uuid",
 *   "org-uuid"
 * );
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Alert>Failed to load</Alert>;
 *
 * const references = hydrationResult?.references || [];
 * return <div>{references.map(ref => ...)}</div>;
 */
export const useBlockHydration = (
    blockId: string | undefined,
    organisationId: string | undefined
): UseQueryResult<BlockHydrationResult, Error> => {
    const { session, loading: authLoading } = useAuth();

    return useQuery<BlockHydrationResult, Error>({
        queryKey: ["block-hydration", blockId, organisationId],
        queryFn: async () => {
            if (!blockId || !organisationId) {
                throw new Error("Block ID and Organisation ID are required");
            }

            const results = await BlockService.hydrateBlocks(
                session,
                [blockId],
                organisationId
            );

            // Extract result for this specific block
            const result = results[blockId];
            if (!result) {
                throw new Error(`No hydration result found for block ${blockId}`);
            }

            if (result.error) {
                throw new Error(result.error);
            }

            return result;
        },
        enabled: !!blockId && !!organisationId && !!session && !authLoading,
        staleTime: 5 * 60 * 1000, // 5 minutes - entity data doesn't change frequently
        refetchOnWindowFocus: false, // Don't refetch on window focus (entity data is stable)
    });
};
