import { BlockNode, BlockSchema, BlockType } from "../../../interface/block.interface";
import { createContentNode } from "./block.factory";

/**
 * Options for creating a block instance from a block type
 */
export interface CreateBlockInstanceOptions {
    /** Optional custom name for the block */
    name?: string;
    /** Optional initial data to override schema defaults */
    initialData?: Record<string, unknown>;
}

/**
 * Creates a BlockNode instance from a BlockType definition.
 *
 * This function generates a new block with default data values based on the
 * block type's schema. It's used when users select a block type from the
 * available catalog and want to add a new instance to their layout.
 *
 * @param blockType - The block type definition from the database
 * @param organisationId - UUID of the organization
 * @param options - Optional configuration for the new block instance
 * @returns A new BlockNode ready to be added to the environment
 *
 * @example
 * ```typescript
 * const layoutContainerType = await blockTypeService.getBlockTypeByKey('layout_container');
 * const newBlock = createBlockInstanceFromType(
 *   layoutContainerType,
 *   organisationId,
 *   { name: 'My Container', initialData: { title: 'Welcome' } }
 * );
 * addTrackedBlock(newBlock);
 * ```
 */
export function createBlockInstanceFromType(
    blockType: BlockType,
    organisationId: string,
    options?: CreateBlockInstanceOptions
): BlockNode {
    // Generate default data based on schema
    const defaultData = generateDefaultDataFromSchema(blockType.schema);

    // Merge with any provided initial data
    const data = options?.initialData
        ? { ...defaultData, ...options.initialData }
        : defaultData;

    // Use block type name as default if no custom name provided
    const name = options?.name ?? blockType.name;

    // Create the block node using the existing factory
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
