package okuri.core.service.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
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
    private val blockRepository: BlockRepository
) {

    fun upsertReferencesFor(blockEntity: BlockEntity, payloadData: Map<String, Any?>) {
        val refs = extractReferences(payloadData)

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
    private fun extractReferences(value: Any?, path: String = "$"): List<ParsedRef> {
        val out = mutableListOf<ParsedRef>()
        when (value) {
            is Map<*, *> -> {
                val t = (value["_refType"] as? String)?.uppercase()
                val id = value["_refId"] as? String
                val own = (value["_ownership"] as? String)?.uppercase() ?: "LINKED"
                if (t != null && id != null) {
                    EntityType.entries.find { it.name == t }?.let { et ->
                        runCatching { UUID.fromString(id) }.getOrNull()?.let { uuid ->
                            out += ParsedRef(
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

    fun findEdgesForBlock(blockId: UUID): Map<String, List<BlockReferenceEntity>> {
        blockReferenceRepository.findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
            blockId,
            BlockOwnership.LINKED,
            EntityType.BLOCK
        ).let { return it.groupBy { edge -> slotKeyFromPath(edge.path) } }
    }


    private fun slotKeyFromPath(path: String): String {
        // e.g. "$.data.contacts[0]" -> "contacts", "$.data/primaryAddress" -> "primaryAddress"
        // naive but effective: take last segment before any [index]
        val last = path.substringAfterLast("/").substringAfterLast(".")
        return last.substringBefore("[")
    }
}

data class ParsedRef(
    val type: EntityType,
    val id: UUID,
    val path: String,
    val ownership: BlockOwnership,
    val orderIndex: Int? = null
)