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

    /** Returns the ordered list of children in a single slot. */
    fun listChildren(parentId: UUID): List<BlockChildEntity> =
        edgeRepository.findByParentIdOrderByOrderIndexAsc(parentId)


    /* =========================
     * Helpers / Validation
     * ========================= */

    private fun load(id: UUID): BlockEntity =
        blockRepository.findById(id).orElseThrow { NoSuchElementException("Block $id not found") }

    /* =========================
     * Mutations
     * ========================= */

    @Transactional
    fun addChild(
        child: BlockEntity,
        parentId: UUID,
        index: Int,
        nesting: BlockTypeNesting
    ): BlockChildEntity {
        val childId = requireNotNull(child.id)

        val parent = load(parentId)
        validateAttach(parent, child, nesting)

        // Ensure this block is not already a child elsewhere (child_id is globally unique)
        edgeRepository.findByChildId(childId)?.let {
            throw IllegalStateException("Block $childId already exists as a child of parent ${it.parentId}")
        }

        val siblings = edgeRepository.findByParentIdOrderByOrderIndexAsc(parentId)
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
                orderIndex = insertAt
            )
        )

        return created
    }

    /**
     * Move a child to a new absolute index within the same slot.
     */
    @Transactional
    fun reorderChildren(parentId: UUID, childId: UUID, newIndex: Int) {
        val siblings = edgeRepository.findByParentIdOrderByOrderIndexAsc(parentId)
        val row = siblings.find { it.childId == childId }
            ?: throw NoSuchElementException("Child $childId not found in parent $parentId")

        val bounded = newIndex.coerceIn(0, siblings.size - 1)
        if (row.orderIndex == bounded) return

        // Remove and reinsert with compacted indices
        val reordered = siblings
            .filter { it.childId != childId }
            .toMutableList()

        reordered.add(bounded, row.copy(orderIndex = bounded))
        renumber(parentId, reordered)
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
        index: Int? = null,
        nesting: BlockTypeNesting
    ) {
        val child = load(childId)
        val newParent = load(newParentId)
        validateAttach(newParent, child, nesting)

        // Remove any existing edge (child_id is globally unique, so at most one edge exists)
        edgeRepository.findByChildId(childId)?.let { existingEdge ->
            edgeRepository.delete(existingEdge)
            // Compact old parent's slot
            val oldSiblings = edgeRepository.findByParentIdOrderByOrderIndexAsc(
                existingEdge.parentId,
            )
            renumber(existingEdge.parentId, oldSiblings)
        }

        // Insert new edge
        val siblings = edgeRepository.findByParentIdOrderByOrderIndexAsc(newParentId)
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
            val siblings = edgeRepository.findByParentIdOrderByOrderIndexAsc(edge.parentId)
            renumber(edge.parentId, siblings)
        }
    }

    /**
     * Remove a specific child from a specific parent slot.
     */
    @Transactional
    fun removeChild(parentId: UUID, childId: UUID) {
        val row = edgeRepository.findByParentIdAndChildId(parentId, childId)
            ?: return

        edgeRepository.delete(row)
        // compact the slot
        val remaining = edgeRepository.findByParentIdOrderByOrderIndexAsc(parentId)
        renumber(parentId, remaining)
    }


    /**
     * Validates org, nesting rules, and max children constraint.
     * Since child_id is globally unique, cycles are impossible in a strict tree.
     */
    private fun validateAttach(parent: BlockEntity, child: BlockEntity, nesting: BlockTypeNesting) {
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

        require(nesting.allowedTypes.any { it == child.type.key }) {
            "Child type '$child.type.key'  is not allowed in parent's nesting rules. Allowed types: ${nesting.allowedTypes.joinToString()}}"
        }

        // 3. Max children constraint
        nesting.max?.let { maxChildren ->
            val currentCount = edgeRepository.countByParentId(parentId)
            require(currentCount < maxChildren) {
                "Parent block ${parent.id} has reached maximum children ($maxChildren)"
            }
        }

        // Note: Cycle detection is not needed since child_id is globally unique -
        // a child can only belong to ONE parent, making cycles impossible in a strict tree
    }

    /** Persist contiguous orderIndex = 0..n-1 for provided rows (already filtered to a slot). */
    private fun renumber(parentId: UUID, rows: List<BlockChildEntity>) {
        rows.forEachIndexed { idx, r ->
            if (r.orderIndex != idx) edgeRepository.save(r.copy(orderIndex = idx))
        }
    }
}
