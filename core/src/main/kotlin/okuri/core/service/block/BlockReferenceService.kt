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

    /**
     * Replaces this block's reference rows and synchronizes OWNED child block parent links to match the provided payload.
     *
     * Parses references from `payloadData`, deletes and recreates the block's BlockReference rows to reflect the parsed state,
     * unparents previously OWNED child blocks that are no longer owned, and assigns this block as parent for newly OWNED child blocks.
     * Enforces that owned children belong to the same organisation and skips assignments that would create a parent cycle or self-parenting.
     *
     * @param blockEntity The block whose references and owned-child relationships will be updated; its `id` and `organisationId` are required.
     * @param payloadData The block payload (typically `data`) from which references are extracted; may contain nested maps/lists with `_refType`, `_refId`, and optional `_ownership`.
     */
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


    /**
     * Checks whether the block with the given `ancestorId` appears in the parent chain of `node`.
     *
     * @param ancestorId The candidate ancestor block ID to search for.
     * @param node The node whose ancestor chain will be traversed; may be null.
     * @return `true` if `ancestorId` is found in `node`'s parent chain, `false` otherwise.
     */
    private fun isAncestor(ancestorId: UUID, node: BlockEntity?): Boolean {
        var cur = node
        while (cur != null) {
            val id = cur.id ?: return false
            if (id == ancestorId) return true
            cur = cur.parent
        }
        return false
    }

    /**
     * Recursively extracts Reference objects from a nested payload structure.
     *
     * Traverses maps and lists starting from the provided path and collects entries that
     * include `_refType` and `_refId` (optionally `_ownership`). Collected references
     * include the JSON-style path where they were found and an `orderIndex` for list elements.
     *
     * @param value The payload node to scan; may be a Map, List, or any other value.
     * @param path JSON-style path prefix used for discovered references (defaults to `$.data`).
     * @return A list of discovered Reference objects with populated `path` and `orderIndex`.
     */
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
     * Retrieve blocks owned by the specified block, grouped by slot key.
     *
     * @return A map from slot key to a list of BlockReferenceEntity representing the block's owned BLOCK references, ordered by path then order index.
     */
    fun findOwnedBlocks(blockId: UUID): Map<String, List<BlockReferenceEntity>> {
        return blockReferenceRepository.findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
            blockId,
            BlockOwnership.OWNED,
            EntityType.BLOCK
        ).groupBy { slotKeyFromPath(it.path) }
    }

    /**
     * Retrieve non-owned references for a block, grouped by slot key.
     *
     * Optionally resolves referenced entities for certain types (clients and blocks) when `expand` is true.
     *
     * @param blockId The block's UUID whose references should be retrieved.
     * @param expand If true, resolve referenced entities for supported types (e.g., clients and blocks); otherwise return unresolved references.
     * @return A map from slot key to a list of BlockReference models representing linked (non-owned) references for that slot.
     */
    fun findLinkedBlocks(blockId: UUID, expand: Boolean = true): Map<String, List<BlockReference<*>>> {
        val expandTypes = if (expand) setOf(EntityType.CLIENT, EntityType.BLOCK /* + others */) else emptySet()
        val refs = loadReferences(blockId, expandTypes)
        val linkable = refs.filter {
            it.entityType != EntityType.BLOCK || (it.entityType == EntityType.BLOCK && it.ownership == BlockOwnership.LINKED)
        }
        return linkable.groupBy { slotKeyFromPath(it.path) }
    }

    /**
     * Load and map block references for a block, optionally resolving referenced entities.
     *
     * This fetches all reference rows for the given block, groups referenced IDs by their entity type,
     * batch-resolves entities for types listed in [expandTypes], and converts each row into a
     * BlockReference model. The returned list preserves ordering by reference path and orderIndex.
     *
     * @param expandTypes Set of entity types to resolve and attach to the resulting models; types
     *                    not included will have no resolved entity attached.
     * @return A list of BlockReference models in path/orderIndex order. For entries whose entityType
     *         is in [expandTypes], the `resolved` field contains the resolved entity; otherwise it is null.
     */
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
