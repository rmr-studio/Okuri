package okuri.core.entity.block

/**
 * Entity representing a reference to the blocks associated with an entity.
 * This allows an entity (ie. Client, Project, etc.) to reference its associated blocks.
 *  - This will hold all reference id to the parent layer blocks.
 *  - These can then be fetched to locate all referenced children, and reconstruct the full tree structure.
 */
class EntityBlocksReferenceEntity