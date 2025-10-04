package okuri.core.service.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import okuri.core.models.block.BlockReference
import okuri.core.models.block.Referenceable
import okuri.core.models.common.Reference
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.block.resolvers.ReferenceResolver
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service for managing block references.
 * Inside a block, a reference can be made to attach another Entity (Client, Project, Task, etc.) to the block,
 * or another block (to create a block hierarchy).
 *
 * These references inside the payload as stored as follows:
 * { "_refType": "BLOCK", "_refId": "f9b7d4e2-..." }
 */
@Service
class BlockReferenceService(
    private val blockReferenceRepository: BlockReferenceRepository,
    private val blockRepository: BlockRepository,
    entityResolvers: List<ReferenceResolver>
) {

    private val resolverByType = entityResolvers.associateBy { it.type }

    fun upsertReferencesFor(blockEntity: BlockEntity, payloadData: Map<String, Any?>) {
        extractReferences(payloadData).let { refs ->


            // 1) rebuild rows for this block
            blockReferenceRepository.deleteByBlockId(requireNotNull(blockEntity.id))
            if (refs.isNotEmpty()) {
                val rows = refs.map {
                    BlockReferenceEntity(
                        block = blockEntity,
                        entityType = it.type,
                        entityId = it.id,
                        ownership = it.ownership,
                        path = it.path,
                        orderIndex = it.orderIndex
                    )
                }
                blockReferenceRepository.saveAll(rows)
            }

            // 2) apply OWNED parenting for BLOCK refs (same org, no self, avoid trivial cycles)
            refs.filter { it.type == EntityType.BLOCK && it.ownership == BlockOwnership.OWNED }.forEach { r ->
                if (r.id == blockEntity.id) {
                    // ignore self
                    return@forEach
                }
                val child = blockRepository.findById(r.id).orElse(null) ?: return@forEach
                require(child.organisationId == blockEntity.organisationId) {
                    "Cross-organisation ownership is not allowed"
                }
                // naive cycle guard: do not set parent if child is already an ancestor
                if (isAncestor(ancestorId = child.id!!, node = blockEntity)) {
                    // skip or log; in STRICT mode you’d throw
                    return@forEach
                }
                if (child.parent?.id != blockEntity.id) {
                    blockRepository.save(child.copy(parent = blockEntity))
                }
            }
        }
    }

    private fun isAncestor(ancestorId: UUID, node: BlockEntity?, seen: MutableSet<UUID> = mutableSetOf()): Boolean {
        var cur = node
        while (cur != null) {
            val id = cur.id ?: return false
            if (!seen.add(id)) return false
            if (id == ancestorId) return true
            cur = cur.parent
        }
        return false
    }

    /** Walk payload and collect {_refType, _refId} refs for block_references. */
    // Extract inline refs from payload.data
    private fun extractReferences(value: Any?, path: String = "$"): List<Reference> {
        val out = mutableListOf<Reference>()
        when (value) {
            is Map<*, *> -> {
                val t = (value["_refType"] as? String)?.uppercase()
                val id = value["_refId"] as? String
                val own = (value["_ownership"] as? String)?.uppercase() ?: "LINKED"
                if (t != null && id != null) {
                    EntityType.entries.find { it.name == t }?.let { et ->
                        runCatching { UUID.fromString(id) }.getOrNull()?.let { uuid ->
                            out += Reference(
                                type = et,
                                id = uuid,
                                path = path,
                                ownership = BlockOwnership.valueOf(own)
                            )
                        }
                    }
                }
                value.forEach { (k, v) -> if (k is String) out += extractReferences(v, "$path/$k") }
            }

            is List<*> -> value.forEachIndexed { idx, v ->
                extractReferences(v, "$path[$idx]").forEach { pr ->
                    out += pr.copy(orderIndex = idx)
                }
            }
        }
        return out
    }

    /**
     * This function finds all blocks that are owned by the given block.
     * Owned blocks are those that are directly referenced and managed by the parent block.
     *
     * A block will only ever own other blocks.
     */
    fun findOwnedBlocks(blockId: UUID): Map<String, List<BlockReferenceEntity>> {
        return blockReferenceRepository.findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
            blockId,
            BlockOwnership.OWNED,
            EntityType.BLOCK
        ).groupBy { slotKeyFromPath(it.path) }
    }

    /**
     * This function finds all objects that a block references, but does not own.
     * This would most likely include referenced external entities (ie. clients, projects, line items).
     * But can also include referenced subsets of blocks).
     */
    fun findLinkedBlocks(blockId: UUID): Map<String, List<BlockReference<*>>> {
        val refs = loadReferences(
            blockId
        )
        val linkable = refs.filter {
            it.entityType != EntityType.BLOCK || (it.entityType == EntityType.BLOCK && it.ownership == BlockOwnership.LINKED)
        }
        return linkable.groupBy { slotKeyFromPath(it.path) }
    }

    fun loadReferences(
        blockId: UUID,
        expandTypes: Set<EntityType> = setOf(EntityType.CLIENT, EntityType.BLOCK)
    ): List<BlockReference<*>> {
        val rows = blockReferenceRepository
            .findByBlockIdOrderByPathAscOrderIndexAsc(blockId) // add this finder

        // group ids by type
        val idsByType = rows.groupBy { it.entityType }
            .mapValues { (_, list) -> list.map { it.entityId }.toSet() }

        // batch fetch by type
        val fetchedByType: Map<EntityType, Map<UUID, Referenceable<*>>> =
            idsByType.mapValues { (type, ids) ->
                if (type in expandTypes) {
                    resolverByType[type]?.fetch(ids) ?: emptyMap()
                } else emptyMap()
            }

        // map to models
        return rows.map { row ->
            val resolved = fetchedByType[row.entityType]?.get(row.entityId)
            row.toModel(resolved)
        }
    }


    private fun slotKeyFromPath(path: String): String {
        // e.g. "$.data.contacts[0]" -> "contacts", "$.data/primaryAddress" -> "primaryAddress"
        // naive but effective: take last segment before any [index]
        val last = path.substringAfterLast("/").substringAfterLast(".")
        return last.substringBefore("[")
    }
}

