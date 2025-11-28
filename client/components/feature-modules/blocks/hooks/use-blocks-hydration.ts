import { useAuth } from "@/components/provider/auth-context";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { BlockService, HydrateBlocksResponse } from "../service/block.service";

/**
 * Hook to hydrate (resolve entity references for) multiple blocks in a single batched request.
 *
 * This is more efficient than using multiple useBlockHydration hooks when you need to
 * hydrate several blocks at once (e.g., all visible blocks on a page).
 *
 * Uses React Query for caching and state management.
 * Automatically handles authentication and loading states.
 *
 * @param blockIds - Array of block UUIDs to hydrate
 * @param organisationId - Organisation context for authorization
 * @returns Map of block ID to hydration result, loading state, and error
 *
 * @example
 * // Hydrate multiple blocks at once
 * const visibleBlockIds = ["block-1", "block-2", "block-3"];
 * const { data: results, isLoading } = useBlocksHydration(
 *   visibleBlockIds,
 *   organisationId
 * );
 *
 * if (isLoading) return <Skeleton />;
 *
 * // Access results per block
 * const block1Result = results?.["block-1"];
 * if (block1Result && !block1Result.error) {
 *   console.log(block1Result.references);
 * }
 */
export const useBlocksHydration = (
    blockIds: string[],
    organisationId: string | undefined
): UseQueryResult<HydrateBlocksResponse, Error> => {
    const { session, loading: authLoading } = useAuth();

    // Sort block IDs for consistent query key (order shouldn't matter for caching)
    const sortedBlockIds = [...blockIds].sort();

    return useQuery<HydrateBlocksResponse, Error>({
        queryKey: ["blocks-hydration", organisationId, ...sortedBlockIds],
        queryFn: async () => {
            if (!organisationId) {
                throw new Error("Organisation ID is required");
            }

            const results = await BlockService.hydrateBlocks(session, blockIds, organisationId);

            return results;
        },
        enabled: blockIds.length > 0 && !!organisationId && !!session && !authLoading,
        staleTime: 5 * 60 * 1000, // 5 minutes - entity data doesn't change frequently
        refetchOnWindowFocus: false, // Don't refetch on window focus
    });
};
