package okuri.core.service.block

import jakarta.transaction.Transactional
import okuri.core.entity.block.BlockChildEntity
import okuri.core.entity.block.BlockEntity
import okuri.core.models.block.structure.BlockTypeNesting
import okuri.core.repository.block.BlockChildrenRepository
import okuri.core.repository.block.BlockRepository
import org.springframework.stereotype.Service
import java.util.*

/**
 * Manages *owned* parent→child block edges with slots & order.
 *
 * - Enforces: same-organisation, allowed types (via parent.type.nesting),
 *   no cycles, contiguous orderIndex per slot.
 * - Uses BlockChildEntity as the single source of truth for hierarchy.
 * - Optionally mirrors parentId on child BlockEntity if that column exists in your schema.
 */
@Service
class BlockChildrenService(
    private val edgeRepository: BlockChildrenRepository,
    private val blockRepository: BlockRepository
) {

    /* =========================
     * Public read operations
     * ========================= */

    /** Returns children grouped by slot, ordered by orderIndex within each slot. */
    fun listChildrenGrouped(parentId: UUID): Map<String, List<BlockChildEntity>> =
        edgeRepository.findByParentIdOrderBySlotAscOrderIndexAsc(parentId)
            .groupBy { it.slot }

    /** Returns the ordered list of children in a single slot. */
    fun listChildren(parentId: UUID, slot: String): List<BlockChildEntity> =
        edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, slot)

    /** Convenience: a lightweight “edges” map for tree building. */
    fun getChildEdges(parentId: UUID): Map<String, List<BlockChildEntity>> =
        listChildrenGrouped(parentId)

    /* =========================
     * Mutations
     * ========================= */

    /**
     * Add a child under a parent at the given slot.
     * If the slot does not exist, it is created.
     * If this is a list parent. Additional parameters can determine the index within the slot, or will just append.
     */
    @Transactional
    fun addChild(
        child: BlockEntity,
        parentId: UUID,
        slot: String,
        index: Int,
        nesting: BlockTypeNesting
    ): BlockChildEntity {
        val childId = requireNotNull(child.id)
        // Ensure this block is not already a child elsewhere
        edgeRepository.findByChildId(childId).run {
            if (this != null) throw IllegalStateException("Block $childId already exists as a child")
        }

        val siblings: List<BlockChildEntity> = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, slot)

        // TODO: Validate Nesting rules, org match, cycle


        val insertAt = index.coerceIn(0, siblings.size)

        // Shift down indexes >= insertAt
        siblings.asReversed().forEach { s ->
            if (s.orderIndex >= insertAt) {
                edgeRepository.save(s.copy(orderIndex = s.orderIndex + 1))
            }
        }

        val created = edgeRepository.save(
            BlockChildEntity(
                id = null,
                parentId = parentId,
                childId = childId,
                slot = slot,
                orderIndex = insertAt
            )
        )

        // Optional: mirror parent pointer on child (if you keep this column)
        trySetChildParent(child, parentId)

        return created
    }

    /**
     * Replace a slot with exactly this ordered list of child IDs (delta upsert).
     * - Inserts new edges
     * - Deletes missing edges
     * - Reorders everything to 0..n-1
     */
    @Transactional
    fun replaceSlot(
        parentId: UUID,
        slot: String,
        orderedChildIds: List<UUID>
    ) {
        val parent = load(parentId)
        // Preload and validate each child type/org
        val children = blockRepository.findAllById(orderedChildIds.toSet())
        val byId = children.associateBy { it.id!! }
        orderedChildIds.forEach { id ->
            val child = byId[id] ?: throw NoSuchElementException("Child $id not found")
            validateAttach(parent, child, slot)
        }

        val existing = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, slot)
        val existingByChild = existing.associateBy { it.childId }

        // Deletes
        val desiredIds = orderedChildIds.toSet()
        val toDelete = existing.filter { it.childId !in desiredIds }
        if (toDelete.isNotEmpty()) edgeRepository.deleteAllInBatch(toDelete)

        // Inserts & reorder
        orderedChildIds.forEachIndexed { idx, id ->
            val row = existingByChild[id]
            if (row == null) {
                edgeRepository.save(
                    BlockChildEntity(
                        id = null,
                        parentId = parentId,
                        childId = id,
                        slot = slot,
                        orderIndex = idx
                    )
                )
                trySetChildParent(byId[id]!!, parentId)
            } else if (row.orderIndex != idx) {
                edgeRepository.save(row.copy(orderIndex = idx))
            }
        }
    }

    /**
     * Move a child to a new absolute index within the same slot.
     */
    @Transactional
    fun reorderWithinSlot(parentId: UUID, slot: String, childId: UUID, newIndex: Int) {
        val siblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, slot)
        val row = siblings.find { it.childId == childId }
            ?: throw NoSuchElementException("Child $childId not found in slot '$slot' of parent $parentId")

        val bounded = newIndex.coerceIn(0, siblings.size - 1)
        if (row.orderIndex == bounded) return

        // Remove and reinsert with compacted indices
        val reordered = siblings
            .filter { it.childId != childId }
            .toMutableList()

        reordered.add(bounded, row.copy(orderIndex = bounded))
        renumber(parentId, slot, reordered)
    }

    /**
     * Move a child to a different slot (same parent), optionally specifying a position.
     */
    @Transactional
    fun moveChildToSlot(parentId: UUID, childId: UUID, fromSlot: String, toSlot: String, index: Int? = null) {
        val row = edgeRepository.findByParentIdAndChildId(parentId, childId)
            ?: throw NoSuchElementException("Child $childId not attached to parent $parentId")
        if (row.slot == toSlot) {
            // same slot -> use reorder
            reorderWithinSlot(parentId, toSlot, childId, index ?: row.orderIndex)
            return
        }

        val parent = load(parentId)
        val child = load(childId)
        validateAttach(parent, child, toSlot)

        // Remove from old slot (compact)
        val fromSiblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, fromSlot)
        val remaining = fromSiblings.filter { it.childId != childId }
        renumber(parentId, fromSlot, remaining)

        // Insert into new slot
        val toSiblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, toSlot)
        val insertAt = index?.coerceIn(0, toSiblings.size) ?: toSiblings.size
        toSiblings.asReversed().forEach { s ->
            if (s.orderIndex >= insertAt) {
                edgeRepository.save(s.copy(orderIndex = s.orderIndex + 1))
            }
        }
        edgeRepository.save(row.copy(slot = toSlot, orderIndex = insertAt))
    }

    /**
     * Reparent a child under a new parent/slot/index.
     * - Validates org, allowed types, cycle.
     * - Updates child's parent pointer if you maintain it.
     */
    @Transactional
    fun reparentChild(
        childId: UUID,
        newParentId: UUID,
        newSlot: String,
        index: Int? = null
    ) {
        val child = load(childId)
        val newParent = load(newParentId)
        validateAttach(newParent, child, newSlot)

        // Remove any existing edge under *any* parent.
        edgeRepository.findByChildId(childId).forEach { edgeRepository.delete(it) }

        // Insert new edge
        addChild(newParentId, childId, newSlot, index)

        // Optional: mirror parent pointer
        trySetChildParent(child, newParentId)
    }

    /**
     * Detach a child from its parent (if any). Does not delete the child block.
     */
    @Transactional
    fun detachChild(childId: UUID) {
        edgeRepository.findByChildId(childId).forEach { edgeRepository.delete(it) }
        // Optional mirror: null out child's parent pointer
        blockRepository.findById(childId).ifPresent { child ->
            if (hasParentPointer(child)) {
                blockRepository.save(child.copy(parentId = null))
            }
        }
    }

    /**
     * Remove a specific child from a specific parent slot.
     */
    @Transactional
    fun removeChild(parentId: UUID, slot: String, childId: UUID) {
        val row = edgeRepository.findByParentIdAndChildId(parentId, childId)
            ?: return
        if (row.slot != slot) return

        edgeRepository.delete(row)
        // compact the slot
        val remaining = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, slot)
        renumber(parentId, slot, remaining)
        // Optional mirror: clear parent pointer only if no other parent edges remain
        if (edgeRepository.findByChildId(childId).isEmpty()) {
            blockRepository.findById(childId).ifPresent { child ->
                if (hasParentPointer(child)) blockRepository.save(child.copy(parentId = null))
            }
        }
    }

    /* =========================
     * Helpers / Validation
     * ========================= */

    private fun load(id: UUID): BlockEntity =
        blockRepository.findById(id).orElseThrow { NoSuchElementException("Block $id not found") }


    /**
     * Validates org, nesting rules, and cycles.
     */
    private fun validateAttach(parent: BlockEntity, child: BlockEntity, slot: String) {
        TODO()
    }

    /** Walk up via BlockChild edges to detect if ancestorId is an ancestor of nodeId. */
    private fun isAncestor(ancestorId: UUID, nodeId: UUID): Boolean {
        var cur: UUID? = nodeId
        val seen = mutableSetOf<UUID>()
        while (cur != null) {
            if (!seen.add(cur)) return true // defensive loop guard
            if (cur == ancestorId) return true
            // find parent(s) of cur; by design we expect at most one direct parent
            val parents = edgeRepository.findParentIdsByChildId(cur)
            cur = parents.firstOrNull() // if multiple parents are theoretically allowed, handle accordingly
        }
        return false
    }

    /** Persist contiguous orderIndex = 0..n-1 for provided rows (already filtered to a slot). */
    private fun renumber(parentId: UUID, slot: String, rows: List<BlockChildEntity>) {
        rows.forEachIndexed { idx, r ->
            if (r.orderIndex != idx) edgeRepository.save(r.copy(orderIndex = idx))
        }
    }
}