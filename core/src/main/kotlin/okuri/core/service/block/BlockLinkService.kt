package okuri.core.service.block

import jakarta.persistence.FetchType
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockReferenceWarning
import okuri.core.enums.core.EntityType
import okuri.core.models.block.BlockReference
import okuri.core.models.block.request.BlockTree
import okuri.core.models.block.structure.ReferenceItem
import okuri.core.models.block.structure.ReferenceMetadata
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.block.resolvers.ReferenceResolver
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service for managing block links.
 *
 * A link can be either:
 *  - A reference to a direct child block as a nested layout (OWNED)
 *  - A reference to another entity (Client, Project, Task, or Block from another workspace) (LINKED)
 */
@Service
class BlockLinkService(
    private val blockReferenceRepository: BlockReferenceRepository,
    private val blockRepository: BlockRepository,
    entityResolvers: List<ReferenceResolver>
) {

    private val resolverByType = entityResolvers.associateBy { it.type }

    /**
     * Removes all references associated with the specified block ID.
     */
    fun removeReferencesForBlock(blockId: UUID) {
        blockReferenceRepository.deleteByParentBlockId(blockId)
    }

    /**
     * Removes all stale references for the specified entity ID, in the event where the entity has been deleted.
     */
    fun removeStaleReferences(entityId: UUID) {
        TODO()
    }

    /**
     * Retrieve blocks owned by the specified block, grouped by slot key.
     *
     * @return A map from slot key to a list of BlockReferenceEntity representing the block's owned BLOCK references, ordered by path then order index.
     */
    fun findOwnedBlocks(blockId: UUID): Map<String, List<BlockReferenceEntity>> {
        return blockReferenceRepository.findChildBlocks(
            blockId,
        ).groupBy { slotKeyFromPath(it.path) }
    }

    /**
     * Retrieve non-owned reference for a block, and
     *
     * @param blockId The block's UUID whose references should be retrieved.
     * @return A map from slot key to a list of BlockReference models representing linked (non-owned) references for that slot.
     */
    fun findBlockReferences(blockId: UUID, ref: ReferenceMetadata): List<BlockReference<*>> {
        val linkedReferences = blockReferenceRepository.findReferencedBlock(blockId).associateBy { it.entityId }
        val references = ref.items.map { meta ->
            linkedReferences[meta.id].let { entity ->
                if (entity == null) {
                    return@map BlockReference(
                        id = null,
                        entityType = meta.type,
                        entityId = meta.id,
                        entity = null,
                        warning = BlockReferenceWarning.MISSING
                    )
                }

                BlockReference(
                    id = entity.id,
                    entityType = entity.entityType,
                    entityId = entity.entityId,
                    entity = null,
                    orderIndex = entity.orderIndex,
                    warning = BlockReferenceWarning.REQUIRES_LOADING
                )
            }

        }

        if (ref.fetchType == FetchType.LAZY) return references
        return resolveReferences(references, ref)
    }


    fun resolveReferences(
        references: List<BlockReference<*>>,
        metadata: ReferenceMetadata
    ): List<BlockReference<*>> {
        val referencesByType = references.groupBy { it.entityType }

        val resolvedEntitiesByTypeAndId = referencesByType.mapValues { (entityType, refs) ->
            val resolver = resolverByType[entityType]
            resolver?.fetch(refs.map { it.entityId }.toSet()) ?: emptyMap()
        }


        return references.map { reference ->
            // No reference was ever found. Cant resolve any associated entity
            if (reference.id == null) return@map reference

            resolvedEntitiesByTypeAndId[reference.entityType].let {
                if (it == null) {
                    return@map reference.copy(
                        // No resolver available for this entity type
                        warning = BlockReferenceWarning.UNSUPPORTED
                    )
                }

                it[reference.entityId].let { entity ->
                    if (entity == null) {
                        return@map reference.copy(
                            warning = BlockReferenceWarning.MISSING
                        )
                    } else {
                        BlockReference(
                            id = reference.id,
                            entityType = reference.entityType,
                            entityId = reference.entityId,
                            entity = entity,
                            orderIndex = reference.orderIndex,
                            warning = null
                        ).run {
                            // Additional processing for BLOCK references
                            if (this.entityType == EntityType.BLOCK) {
                                // We can attach the block tree structure if we have the metadata available
                                val blockMeta = metadata.items.find { meta -> meta.id == this.entityId }
                                if (blockMeta != null) {
                                    return@map resolveBlockReference(this, blockMeta)
                                }
                            }
                            return@map this
                        }
                    }
                }
            }
        }
    }

    /**
     * In the event where a block references another block from a different workspace/environment. There may be a chance that block
     * has a nested layout of its own. This will use the stored metadata to build the appropriate view of the referenced block
     */
    fun resolveBlockReference(
        reference: BlockReference<*>,
        metadata: ReferenceItem
    ): BlockReference<BlockTree> {
        TODO()
    }


    /**
     * Extracts the slot key (the final path segment) from a JSON/dotted path string.
     *
     * @param path Path such as "$.data.contacts[0]" or "$.data/primaryAddress".
     * @return The last segment of the path without any array index (e.g. "contacts", "primaryAddress").
     */
    private fun slotKeyFromPath(path: String): String {
        // e.g. "$.data.contacts[0]" -> "contacts", "$.data/primaryAddress" -> "primaryAddress"
        // naive but effective: take last segment before any [index]
        val last = path.substringAfterLast("/").substringAfterLast(".")
        return last.substringBefore("[")
    }
}
