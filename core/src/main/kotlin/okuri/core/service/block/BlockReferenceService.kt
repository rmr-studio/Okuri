package okuri.core.service.block

import jakarta.transaction.Transactional
import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockReferenceFetchPolicy
import okuri.core.enums.block.BlockReferenceWarning
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Block
import okuri.core.models.block.BlockTree
import okuri.core.models.block.Reference
import okuri.core.models.block.Referenceable
import okuri.core.models.block.structure.BlockReferenceMetadata
import okuri.core.models.block.structure.EntityReferenceMetadata
import okuri.core.repository.block.BlockReferenceRepository
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
class BlockReferenceService(
    private val blockReferenceRepository: BlockReferenceRepository,
    resolvers: List<ReferenceResolver>
) {
    private val resolverByType = resolvers.associateBy { it.type }

    // -------- LIST OF ENTITIES --------
    @Transactional
    fun upsertLinksFor(block: BlockEntity, meta: EntityReferenceMetadata) {
        val blockId = requireNotNull(block.id)
        if (!meta.allowDuplicates) {
            val dups = meta.items.groupBy { it.type to it.id }.filterValues { it.size > 1 }
            require(dups.isEmpty()) { "Duplicate references are not allowed: ${dups.keys}" }
        }
        require(meta.items.none { it.type == EntityType.BLOCK }) {
            "ReferenceListMetadata cannot include BLOCK references (use BlockLinkMetadata)."
        }

        val existing = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        val existingByKey = existing.associateBy { Triple(it.entityType, it.entityId, it.path) }

        val desired: Map<Triple<EntityType, UUID, String>, Int> =
            meta.items.mapIndexed { idx, ref ->
                Triple(ref.type, ref.id, "${meta.path}[$idx]") to idx
            }.toMap()

        val toDelete = existing.filter { Triple(it.entityType, it.entityId, it.path) !in desired.keys }
        if (toDelete.isNotEmpty()) blockReferenceRepository.deleteAllInBatch(toDelete)

        val toSave = mutableListOf<BlockReferenceEntity>()
        desired.forEach { (triple, idx) ->
            val (etype, eid, path) = triple
            val row = existingByKey[triple]
            if (row == null) {
                toSave += BlockReferenceEntity(
                    id = null,
                    parentId = blockId,
                    entityType = etype,
                    entityId = eid,
                    path = path,
                    orderIndex = idx
                )
            } else if (row.orderIndex != idx) {
                toSave += row.copy(orderIndex = idx)
            }
        }
        if (toSave.isNotEmpty()) blockReferenceRepository.saveAll(toSave)
    }

    fun findListReferences(blockId: UUID, meta: EntityReferenceMetadata): List<Reference<*>> {
        val rows = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        val byTypeId = rows.associateBy { it.entityType to it.entityId }

        val base = meta.items.mapIndexed { idx, item ->
            val row = byTypeId[item.type to item.id]
            if (row == null) Reference(
                id = null, entityType = item.type, entityId = item.id,
                entity = null, orderIndex = idx, warning = BlockReferenceWarning.MISSING
            ) else Reference(
                id = row.id, entityType = row.entityType, entityId = row.entityId,
                entity = null, orderIndex = row.orderIndex ?: idx, warning = BlockReferenceWarning.REQUIRES_LOADING
            )
        }

        if (meta.fetchPolicy == BlockReferenceFetchPolicy.LAZY) return base

        val byType = base.filter { it.id != null }.groupBy { it.entityType }
        val resolvedByType = byType.mapNotNull { (t, refs) ->
            val resolver = resolverByType[t] ?: return@mapNotNull null
            t to resolver.fetch(refs.map { it.entityId }.toSet())
        }.toMap()

        return base.map { r ->
            if (r.id == null) r
            else {
                val bucket =
                    resolvedByType[r.entityType] ?: return@map r.copy(warning = BlockReferenceWarning.UNSUPPORTED)
                val ent = bucket[r.entityId] ?: return@map r.copy(warning = BlockReferenceWarning.MISSING)
                Reference(
                    id = r.id,
                    entityType = r.entityType,
                    entityId = r.entityId,
                    entity = ent,
                    orderIndex = r.orderIndex,
                    warning = null
                )
            }
        }
    }

    // -------- SINGLE BLOCK LINK --------
    @Transactional
    fun upsertBlockLinkFor(block: BlockEntity, meta: BlockReferenceMetadata) {
        val blockId = requireNotNull(block.id)
        require(meta.item.type == EntityType.BLOCK) { "BlockLinkMetadata.target must be type BLOCK" }

        val existing = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        require(existing.size <= 1) {
            "Multiple rows found at single-link path '${meta.path}'. Data needs normalization."
        }

        val row = existing.firstOrNull()
        if (row == null) {
            blockReferenceRepository.save(
                BlockReferenceEntity(
                    id = null,
                    parentId = blockId,
                    entityType = EntityType.BLOCK,
                    entityId = meta.item.id,
                    path = meta.path,          // e.g. "$.block"
                    orderIndex = null
                )
            )
        } else if (row.entityId != meta.item.id) {
            blockReferenceRepository.save(row.copy(entityId = meta.item.id))
        }
    }

    fun findBlockLink(blockId: UUID, meta: BlockReferenceMetadata): Reference<Block> {
        val rows = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        val row = rows.firstOrNull()
            ?: return Reference(
                id = null,
                entityType = EntityType.BLOCK,
                entityId = meta.item.id,
                entity = null,
                warning = BlockReferenceWarning.MISSING
            )

        // LAZY ⇒ unresolved
        if (meta.fetchPolicy == BlockReferenceFetchPolicy.LAZY) {
            return Reference(
                id = row.id,
                entityType = row.entityType,
                entityId = row.entityId,
                entity = null,
                warning = BlockReferenceWarning.REQUIRES_LOADING
            )
        }

        // EAGER ⇒ resolve to a lightweight Block referenceable (or use a BLOCK resolver)
        val child = resolverByType[EntityType.BLOCK]?.fetch(setOf(row.entityId))?.get(row.entityId)
            ?: return Reference(
                id = row.id,
                entityType = row.entityType,
                entityId = row.entityId,
                entity = null,
                warning = BlockReferenceWarning.MISSING
            )

        child.toReference().run {
            if (this is Block) {
                return Reference(
                    id = row.id,
                    entityType = row.entityType,
                    entityId = row.entityId,
                    entity = this,
                    warning = null
                )
            }

            throw IllegalStateException("Resolved entity is not of type Block")
        }
    }
}
