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
import org.springframework.transaction.annotation.Transactional
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

    @Transactional
    fun upsertReferencesFor(blockEntity: BlockEntity, payloadData: Map<String, Any?>) {
        val blockId = requireNotNull(blockEntity.id)

        // --- 1) Parse incoming refs (NEW desired state) ---
        val refs = extractReferences(payloadData)

        // --- 2) Capture PREVIOUS state of OWNED BLOCK children (before we delete rows) ---
        val prevOwnedRows = blockReferenceRepository
            .findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
                blockId,
                BlockOwnership.OWNED,
                EntityType.BLOCK
            )
        val prevOwnedIds: Set<UUID> = prevOwnedRows.map { it.entityId }.toSet()

        // --- 3) Compute NEXT state of OWNED BLOCK children from parsed refs ---
        val nextOwnedIds: Set<UUID> = refs
            .asSequence()
            .filter { it.type == EntityType.BLOCK && it.ownership == BlockOwnership.OWNED }
            .map { it.id }
            .toSet()

        // --- 4) Delta = children to UNPARENT (were owned before, not owned now) ---
        val toUnparent: Set<UUID> = prevOwnedIds - nextOwnedIds
        if (toUnparent.isNotEmpty()) {
            val children = blockRepository.findAllById(toUnparent).filter {
                // Only clear parent if we are the current parent
                it.parent?.id == blockId
            }
            if (children.isNotEmpty()) {
                // Clear parent in batch
                val cleared = children.map { it.copy(parent = null) }
                blockRepository.saveAll(cleared)
            }
        }

        // --- 5) Rebuild block_references rows for THIS block ---
        blockReferenceRepository.deleteByBlockId(blockId)
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

        // --- 6) Apply OWNED parenting for CURRENT desired children ---
        // (enforce single-parent, same-tenant, and basic cycle guard)
        nextOwnedIds.forEach { childId ->
            if (childId == blockId) return@forEach // ignore self

            val child = blockRepository.findById(childId).orElse(null) ?: return@forEach
            require(child.organisationId == blockEntity.organisationId) {
                "Cross-organisation ownership is not allowed"
            }
            // Prevent trivial cycles: if child is an ancestor of the parent, skip
            if (isAncestor(ancestorId = child.id!!, node = blockEntity)) {
                // For STRICT mode, you'd throw; for MVP, just skip.
                return@forEach
            }

            // If child already points to US, nothing to do; else (re)assign
            if (child.parent?.id != blockId) {
                blockRepository.save(child.copy(parent = blockEntity))
            }
        }
    }


    private fun isAncestor(ancestorId: UUID, node: BlockEntity?): Boolean {
        var cur = node
        while (cur != null) {
            val id = cur.id ?: return false
            if (id == ancestorId) return true
            cur = cur.parent
        }
        return false
    }

    /** Walk payload.data and collect {_refType, _refId, _ownership} refs */
    private fun extractReferences(value: Any?, path: String = "$.data"): List<Reference> {
        val out = mutableListOf<Reference>()
        when (value) {
            is Map<*, *> -> {
                val t = (value["_refType"] as? String)?.uppercase()
                val id = value["_refId"] as? String
                val own = (value["_ownership"] as? String)?.uppercase() ?: "LINKED"
                if (t != null && id != null) {
                    EntityType.values().find { it.name == t }?.let { et ->
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
    fun findLinkedBlocks(blockId: UUID, expand: Boolean = true): Map<String, List<BlockReference<*>>> {
        val expandTypes = if (expand) setOf(EntityType.CLIENT, EntityType.BLOCK /* + others */) else emptySet()
        val refs = loadReferences(blockId, expandTypes)
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

