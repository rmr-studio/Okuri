import { BlockMetadataType, EntityType } from "@/lib/types/types";
import { BlockNode, BlockSchema, BlockType } from "../../../interface/block.interface";
import {
    createBlockReferenceMetadata,
    createContentNode,
    createEntityReferenceMetadata,
    createListConfiguration,
    createReferenceNode,
} from "./block.factory";

/**
 * Options for creating a block instance from a block type
 */
export interface CreateBlockInstanceOptions {
    /** Optional custom name for the block */
    name?: string;
    /** Optional initial data to override schema defaults */
    initialData?: Record<string, unknown>;
    /** Entity type for entity reference blocks (CLIENT, INVOICE, etc.) */
    entityType?: EntityType;
    /** Allowed block type keys for block lists (null = allow all types) */
    allowedTypes?: string[] | null;
}

/**
 * Determines if a block type is a reference block (entity or block reference).
 */
function isReferenceBlockType(blockType: BlockType): boolean {
    return blockType.key === "entity_reference" || blockType.key === "block_reference";
}

/**
 * Determines if a block type is a list block that requires listConfig.
 */
function isListBlockType(blockType: BlockType): boolean {
    return blockType.key === "block_list" || blockType.key === "content_block_list";
}

/**
 * Creates a BlockNode instance from a BlockType definition.
 *
 * This function generates a new block with default data values based on the
 * block type's schema. It's used when users select a block type from the
 * available catalog and want to add a new instance to their layout.
 *
 * This function automatically detects special block types and handles them appropriately:
 * - Reference blocks (entity_reference, block_reference) → ReferenceNode
 * - List blocks (block_list, content_block_list) → ContentNode with listConfig
 * - Regular blocks → ContentNode
 *
 * @param blockType - The block type definition from the database
 * @param organisationId - UUID of the organization
 * @param options - Optional configuration for the new block instance
 * @returns A new BlockNode ready to be added to the environment
 *
 * @example
 * ```typescript
 * // Regular content block
 * const layoutType = await blockTypeService.getBlockTypeByKey('layout_container');
 * const newBlock = createBlockInstanceFromType(
 *   layoutType,
 *   organisationId,
 *   { name: 'My Container', initialData: { title: 'Welcome' } }
 * );
 *
 * // Reference block
 * const entityRefType = await blockTypeService.getBlockTypeByKey('entity_reference');
 * const refBlock = createBlockInstanceFromType(entityRefType, organisationId);
 * // Returns a ReferenceNode with empty items array
 *
 * // List block
 * const listType = await blockTypeService.getBlockTypeByKey('block_list');
 * const listBlock = createBlockInstanceFromType(listType, organisationId);
 * // Returns a ContentNode with listConfig populated
 * ```
 */
export function createBlockInstanceFromType(
    blockType: BlockType,
    organisationId: string,
    options?: CreateBlockInstanceOptions
): BlockNode {
    // Use block type name as default if no custom name provided
    const name = options?.name ?? blockType.name;

    // Handle reference blocks (entity_reference, block_reference)
    if (isReferenceBlockType(blockType)) {
        if (blockType.key === "entity_reference") {
            // Create entity reference block with empty items
            // Use provided entity type or undefined (will need to be set later)
            const entityType = options?.entityType;
            const payload = createEntityReferenceMetadata(entityType);

            // Use entity type in name if provided
            const blockName = entityType
                ? name ?? `${entityType.charAt(0) + entityType.slice(1).toLowerCase()} Reference`
                : name ?? blockType.name;

            return createReferenceNode({
                organisationId,
                type: blockType,
                name: blockName,
                payload,
            });
        } else {
            // Create block reference with empty item
            const payload = createBlockReferenceMetadata();
            return createReferenceNode({
                organisationId,
                type: blockType,
                name,
                payload,
            });
        }
    }

    // Handle list blocks (block_list, content_block_list)
    if (isListBlockType(blockType)) {
        // Generate default data based on schema
        const defaultData = generateDefaultDataFromSchema(blockType.schema);

        // Merge with any provided initial data
        const data = options?.initialData
            ? { ...defaultData, ...options.initialData }
            : defaultData;

        // Determine allowed types:
        // 1. Use provided allowedTypes from options (can be array or null)
        // 2. Fall back to block type's nesting.allowedTypes
        // 3. undefined means no restriction (allow all)
        const allowedTypes =
            options?.allowedTypes !== undefined
                ? options.allowedTypes || undefined  // null becomes undefined (allow all)
                : blockType.nesting?.allowedTypes;

        const listConfig = createListConfiguration(allowedTypes);

        // Create content node with list configuration
        return createContentNode({
            organisationId,
            type: blockType,
            data,
            name,
            payloadOverride: {
                type: BlockMetadataType.CONTENT,
                deletable: true,
                data,
                meta: {
                    validationErrors: [],
                },
                listConfig,
            },
        });
    }

    // Handle regular content blocks
    // Generate default data based on schema
    const defaultData = generateDefaultDataFromSchema(blockType.schema);

    // Merge with any provided initial data
    const data = options?.initialData ? { ...defaultData, ...options.initialData } : defaultData;

    // Create content node
    return createContentNode({
        organisationId,
        type: blockType,
        data,
        name,
    });
}

/**
 * Generates default data values based on a block schema definition.
 *
 * This function recursively processes the schema to create sensible default
 * values for each property type:
 * - STRING → empty string ""
 * - NUMBER → 0
 * - BOOLEAN → false
 * - OBJECT → recursively generated object with defaults for nested properties
 * - ARRAY → empty array []
 *
 * @param schema - The block schema definition
 * @returns An object with default values for all schema properties
 *
 * @example
 * ```typescript
 * const schema = {
 *   type: 'OBJECT',
 *   properties: {
 *     title: { type: 'STRING' },
 *     count: { type: 'NUMBER' },
 *     active: { type: 'BOOLEAN' }
 *   }
 * };
 * const defaults = generateDefaultDataFromSchema(schema);
 * // Result: { title: '', count: 0, active: false }
 * ```
 */
export function generateDefaultDataFromSchema(schema: BlockSchema): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // Only OBJECT schemas have properties
    if (schema.type !== "OBJECT" || !schema.properties) {
        return data;
    }

    // Generate defaults for each property
    for (const [key, property] of Object.entries(schema.properties)) {
        data[key] = getDefaultValueForType(property);
    }

    return data;
}

/**
 * Returns an appropriate default value for a schema property based on its type.
 *
 * @param property - The schema property definition
 * @returns A default value appropriate for the property type
 */
function getDefaultValueForType(property: BlockSchema): unknown {
    switch (property.type) {
        case "STRING":
            return "";

        case "NUMBER":
            return 0;

        case "BOOLEAN":
            return false;

        case "OBJECT":
            // Recursively generate defaults for nested object
            return generateDefaultDataFromSchema(property);

        case "ARRAY":
            return [];

        default:
            // For unknown types, return null
            return null;
    }
}

/**
 * Creates multiple block instances from an array of block types.
 *
 * This is useful for batch operations or creating a set of related blocks
 * (e.g., initializing a template with multiple blocks).
 *
 * @param blockTypes - Array of block type definitions
 * @param organisationId - UUID of the organization
 * @param optionsMap - Optional map of block type keys to creation options
 * @returns Array of new BlockNodes
 *
 * @example
 * ```typescript
 * const types = [layoutType, listType, noteType];
 * const blocks = createBlockInstancesFromTypes(types, organisationId, {
 *   'layout_container': { name: 'Main Container' },
 *   'block_list': { name: 'Task List' }
 * });
 * ```
 */
export function createBlockInstancesFromTypes(
    blockTypes: BlockType[],
    organisationId: string,
    optionsMap?: Record<string, CreateBlockInstanceOptions>
): BlockNode[] {
    return blockTypes.map((blockType) => {
        const options = optionsMap?.[blockType.key];
        return createBlockInstanceFromType(blockType, organisationId, options);
    });
}
