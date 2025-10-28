package okuri.core.service.block

import jakarta.transaction.Transactional
import okuri.core.entity.block.BlockChildEntity
import okuri.core.entity.block.BlockEntity
import okuri.core.models.block.display.BlockTypeNesting
import okuri.core.models.block.metadata.BlockContentMetadata
import okuri.core.repository.block.BlockChildrenRepository
import okuri.core.repository.block.BlockRepository
import org.springframework.stereotype.Service
import java.util.*

/**
 * Manages *owned* parent→child block edges with slots & order.
 *
 * - Enforces: same-organisation, allowed types (via parent.type.nesting),
 *   max children constraint, contiguous orderIndex per slot.
 * - Uses BlockChildEntity as the single source of truth for hierarchy.
 * - Constraint: child_id is globally unique - a child can only belong to ONE parent.
 * - Optionally mirrors parentId on child BlockEntity for denormalization/query performance.
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

    /** Convenience: a lightweight "edges" map for tree building. */
    fun getChildEdges(parentId: UUID): Map<String, List<BlockChildEntity>> =
        listChildrenGrouped(parentId)

    /* =========================
     * Mutations
     * ========================= */

    /**
     * Add a child under a parent at the given slot.
     * If the slot does not exist, it is created.
     * If this is a list parent, the index parameter determines the position within the slot.
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

        val parent = load(parentId)
        validateAttach(parent, child, slot, nesting)

        // Ensure this block is not already a child elsewhere (child_id is globally unique)
        edgeRepository.findByChildId(childId)?.let {
            throw IllegalStateException("Block $childId already exists as a child of parent ${it.parentId}")
        }

        val siblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, slot)
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

        return created
    }

    /**
     * Replace a slot with exactly this ordered list of child IDs (delta upsert).
     * - Inserts new edges
     * - Deletes missing edges
     * - Reorders everything to 0..n-1
     * - Auto-reparents children if they're currently children of other parents
     */
    @Transactional
    fun replaceSlot(
        parentId: UUID,
        slot: String,
        orderedChildIds: List<UUID>,
        nesting: BlockTypeNesting
    ) {
        require(orderedChildIds.distinct().size == orderedChildIds.size) {
            "Duplicate child IDs not allowed in slot '$slot' for parent $parentId"
        }
        val parent = load(parentId)
        // Preload and validate each child type/org
        val children = blockRepository.findAllById(orderedChildIds.toSet())
        val byId = children.associateBy { it.id!! }
        orderedChildIds.forEach { id ->
            val child = byId[id] ?: throw NoSuchElementException("Child $id not found")
            validateAttach(parent, child, slot, nesting)

            // If child is already a child of another parent, detach it first
            edgeRepository.findByChildId(id)?.let { existingEdge ->
                if (existingEdge.parentId != parentId || existingEdge.slot != slot) {
                    edgeRepository.delete(existingEdge)
                    // Clean up old parent's slot ordering
                    val oldSiblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(
                        existingEdge.parentId,
                        existingEdge.slot
                    )
                    renumber(existingEdge.parentId, existingEdge.slot, oldSiblings)
                }
            }
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
    fun moveChildToSlot(
        parentId: UUID,
        childId: UUID,
        fromSlot: String,
        toSlot: String,
        index: Int? = null,
        nesting: BlockTypeNesting
    ) {
        val row = edgeRepository.findByParentIdAndChildId(parentId, childId)
            ?: throw NoSuchElementException("Child $childId not attached to parent $parentId")
        require(row.slot == fromSlot) {
            "Child $childId is in slot '${row.slot}', not '$fromSlot'"
        }

        if (row.slot == toSlot) {
            // same slot -> use reorder
            reorderWithinSlot(parentId, toSlot, childId, index ?: row.orderIndex)
            return
        }

        val parent = load(parentId)
        val child = load(childId)
        validateAttach(parent, child, toSlot, nesting)

        // Remove from old slot (compact using actual slot)
        val fromSiblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, row.slot)
        val remaining = fromSiblings.filter { it.childId != childId }
        renumber(parentId, row.slot, remaining)

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
     * - Validates org, allowed types, max children.
     * - Updates child's parent pointer if maintained.
     */
    @Transactional
    fun reparentChild(
        childId: UUID,
        newParentId: UUID,
        newSlot: String,
        index: Int? = null,
        nesting: BlockTypeNesting
    ) {
        val child = load(childId)
        val newParent = load(newParentId)
        validateAttach(newParent, child, newSlot, nesting)

        // Remove any existing edge (child_id is globally unique, so at most one edge exists)
        edgeRepository.findByChildId(childId)?.let { existingEdge ->
            edgeRepository.delete(existingEdge)
            // Compact old parent's slot
            val oldSiblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(
                existingEdge.parentId,
                existingEdge.slot
            )
            renumber(existingEdge.parentId, existingEdge.slot, oldSiblings)
        }

        // Insert new edge
        val siblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(newParentId, newSlot)
        val insertAt = index?.coerceIn(0, siblings.size) ?: siblings.size

        // Shift siblings
        siblings.asReversed().forEach { s ->
            if (s.orderIndex >= insertAt) {
                edgeRepository.save(s.copy(orderIndex = s.orderIndex + 1))
            }
        }

        edgeRepository.save(
            BlockChildEntity(
                id = null,
                parentId = newParentId,
                childId = childId,
                slot = newSlot,
                orderIndex = insertAt
            )
        )
    }

    /**
     * Detach a child from its parent (if any). Does not delete the child block.
     */
    @Transactional
    fun detachChild(childId: UUID) {
        edgeRepository.findByChildId(childId)?.let { edge ->
            edgeRepository.delete(edge)
            // Compact the parent's slot
            val siblings = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(edge.parentId, edge.slot)
            renumber(edge.parentId, edge.slot, siblings)
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
    }

    /* =========================
     * Helpers / Validation
     * ========================= */

    private fun load(id: UUID): BlockEntity =
        blockRepository.findById(id).orElseThrow { NoSuchElementException("Block $id not found") }


    /**
     * Validates org, nesting rules, and max children constraint.
     * Since child_id is globally unique, cycles are impossible in a strict tree.
     */
    private fun validateAttach(parent: BlockEntity, child: BlockEntity, slot: String, nesting: BlockTypeNesting) {
        // 1. Same organisation check
        require(parent.organisationId == child.organisationId) {
            "Cannot attach child from different organisation (parent: ${parent.organisationId}, child: ${child.organisationId})"
        }

        require(parent.payload is BlockContentMetadata) {
            "Cannot attach children to a reference block (parent: ${parent.id})"
        }

        val parentId = requireNotNull(parent.id)
        requireNotNull(child.id)

        // 2. Nesting rules: check if child's type is allowed
        val childType = child.type.key
        val allowedTypes = nesting.allowedTypes
        // Convert child type key to ComponentType enum name format for comparison
        // e.g., "contact" -> "CONTACT", "contact-card" -> "CONTACT_CARD"
        val normalizedChildType = childType.uppercase().replace("-", "_")
        require(allowedTypes.any { it.name == normalizedChildType }) {
            "Child type '$childType' (normalized: '$normalizedChildType') is not allowed in parent's nesting rules. Allowed types: ${allowedTypes.map { it.name }}"
        }

        // 3. Max children constraint
        nesting.max?.let { maxChildren ->
            val currentCount = edgeRepository.countByParentIdAndSlot(parentId, slot)
            require(currentCount < maxChildren) {
                "Parent block ${parent.id} has reached maximum children ($maxChildren) in slot '$slot'"
            }
        }

        // Note: Cycle detection is not needed since child_id is globally unique -
        // a child can only belong to ONE parent, making cycles impossible in a strict tree
    }

    /** Persist contiguous orderIndex = 0..n-1 for provided rows (already filtered to a slot). */
    private fun renumber(parentId: UUID, slot: String, rows: List<BlockChildEntity>) {
        rows.forEachIndexed { idx, r ->
            if (r.orderIndex != idx) edgeRepository.save(r.copy(orderIndex = idx))
        }
    }
}
