import { EntityType } from "@/lib/types/types";

/**
 * Configuration for entity-specific block type restrictions.
 *
 * Defines which block types can be added to each entity type's block environment.
 * This enables entity-specific allowlists for block creation.
 */
export interface EntityBlockConfig {
    /** Block type keys that are allowed for this entity */
    allowedBlockTypes: string[];
    /** Default blocks to create (besides the mandatory reference block) */
    defaultBlocks?: string[];
}

/**
 * Entity-specific block type allowlists.
 *
 * Each entity type can restrict which block types users can add to their layout.
 * This provides flexibility while maintaining data integrity per entity type.
 *
 * @example
 * // Get allowed block types for clients
 * const config = getEntityBlockConfig(EntityType.CLIENT);
 * const canAddBlock = config.allowedBlockTypes.includes(blockTypeKey);
 */
export const ENTITY_BLOCK_CONFIG: Record<EntityType, EntityBlockConfig> = {
    [EntityType.CLIENT]: {
        allowedBlockTypes: [
            "reference",
            "note",
            "task_list",
            "layout_container",
            "content_block_list",
        ],
        defaultBlocks: [], // To be defined later (post-MVP)
    },
    [EntityType.ORGANISATION]: {
        allowedBlockTypes: ["reference", "note", "layout_container", "content_block_list"],
        defaultBlocks: [],
    },
    [EntityType.PROJECT]: {
        allowedBlockTypes: ["reference", "note", "task_list", "layout_container"],
        defaultBlocks: [],
    },
    [EntityType.INVOICE]: {
        allowedBlockTypes: ["reference", "note"],
        defaultBlocks: [],
    },
};

/**
 * Gets the block configuration for a specific entity type.
 *
 * @param entityType - The entity type to get configuration for
 * @returns EntityBlockConfig with allowed block types
 *
 * @example
 * const config = getEntityBlockConfig(EntityType.client);
 * console.log(config.allowedBlockTypes); // ["reference", "note", ...]
 */
export const getEntityBlockConfig = (entityType: EntityType): EntityBlockConfig => {
    return (
        ENTITY_BLOCK_CONFIG[entityType] || {
            allowedBlockTypes: ["reference", "note"], // Fallback to basic types
        }
    );
};

/**
 * Checks if a block type is allowed for a specific entity type.
 *
 * @param entityType - The entity type to check against
 * @param blockTypeKey - The block type key to validate
 * @returns true if the block type is allowed
 *
 * @example
 * if (isBlockTypeAllowed(EntityType.CLIENT, "task_list")) {
 *   // Can add task list to client
 * }
 */
export const isBlockTypeAllowed = (entityType: EntityType, blockTypeKey: string): boolean => {
    const config = getEntityBlockConfig(entityType);
    return config.allowedBlockTypes.includes(blockTypeKey);
};
