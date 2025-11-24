import { useAuth } from "@/components/provider/auth-context";
import { AuthenticatedQueryResult } from "@/lib/interfaces/interface";
import { useQuery } from "@tanstack/react-query";
import { BlockType } from "../interface/block.interface";
import { EntityType } from "../interface/layout.interface";
import { BlockTypeService } from "../service/block-type.service";

/**
 * React Query hook to fetch available block types for an organization.
 *
 * This hook fetches both system-defined and organization-specific block types
 * from the backend. It includes caching and automatic refetching capabilities
 * provided by React Query.
 *
 * @param organisationId - UUID of the organization
 * @param entityType - Optional entity type to filter block types (client-side filtering for MVP)
 * @param includeSystem - Whether to include system block types (default: true)
 * @returns React Query result with block types, loading state, and error handling
 *
 * @example
 * ```typescript
 * function BlockSelector({ organisationId }) {
 *   const { blockTypes, isLoading, error } = useAvailableBlockTypes(organisationId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>Error loading block types</Alert>;
 *
 *   return (
 *     <ul>
 *       {blockTypes.map(type => (
 *         <li key={type.id}>{type.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useBlockTypes(
    organisationId: string,
    entityType?: EntityType,
    includeSystem: boolean = true
): AuthenticatedQueryResult<BlockType[]> {
    const { session, loading } = useAuth();
    const query = useQuery({
        queryKey: ["blockTypes", organisationId, includeSystem],
        queryFn: async () => {
            const types = await BlockTypeService.getBlockTypes(session, organisationId);

            // Filter out archived types
            let filteredTypes = types.filter((type) => !type.archived);

            // Optionally include only system types
            if (!includeSystem) {
                filteredTypes = filteredTypes.filter((type) => !type.system);
            }

            // TODO: Future enhancement - filter by entity type on backend
            // For now, return all available types
            // if (entityType) {
            //   filteredTypes = filterByEntityType(filteredTypes, entityType);
            // }

            return filteredTypes;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - block types don't change frequently
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
        refetchOnWindowFocus: false,
        enabled: !!organisationId && !!session?.user.id, // Only run query if organisationId is provided, and user is authenticated
    });

    return {
        isLoadingAuth: loading,
        ...query,
    };
}

/**
 * Hook to fetch a specific block type by its key.
 *
 * @param key - Unique key of the block type
 * @param organisationId - UUID of the organization
 * @returns React Query result with the specific block type
 *
 * @example
 * ```typescript
 * const { blockType, isLoading } = useBlockTypeByKey('layout_container', organisationId);
 * ```
 */
export function useBlockTypeByKey(
    key: string,
    organisationId: string
): AuthenticatedQueryResult<BlockType> {
    const { session, loading } = useAuth();
    const query = useQuery({
        queryKey: ["blockType", key, organisationId],
        queryFn: () => BlockTypeService.getBlockTypeByKey(session, key),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!key && !!organisationId && !!session?.user.id,
    });

    return {
        ...query,
        isLoadingAuth: loading,
    };
}

/**
 * Helper function to categorize block types for UI display.
 *
 * Groups block types into logical categories for better UX in selection dialogs.
 *
 * @param blockTypes - Array of block types to categorize
 * @returns Object with block types grouped by category
 */
export function categorizeBlockTypes(blockTypes: BlockType[]): {
    layout: BlockType[];
    content: BlockType[];
    reference: BlockType[];
    custom: BlockType[];
} {
    const categories = {
        layout: [] as BlockType[],
        content: [] as BlockType[],
        reference: [] as BlockType[],
        custom: [] as BlockType[],
    };

    blockTypes.forEach((type) => {
        // Custom (non-system) types go in their own category
        if (!type.system) {
            categories.custom.push(type);
            return;
        }

        // Categorize system types based on key patterns
        switch (type.key) {
            // Layout & Containers
            case "layout_container":
            case "project_overview":
                categories.layout.push(type);
                break;

            // References
            case "block_reference":
            case "entity_reference_list":
                categories.reference.push(type);
                break;

            // Content blocks (lists, notes, tasks, addresses, etc.)
            case "block_list":
            case "content_block_list":
            case "note":
            case "project_task":
            case "postal_address":
                categories.content.push(type);
                break;

            // Fallback: use pattern matching for unknown types
            default:
                if (type.key.includes("container") || type.key.includes("layout")) {
                    categories.layout.push(type);
                } else if (type.key.includes("reference")) {
                    categories.reference.push(type);
                } else {
                    // Default to content for unknown system types
                    categories.content.push(type);
                }
        }
    });

    return categories;
}
