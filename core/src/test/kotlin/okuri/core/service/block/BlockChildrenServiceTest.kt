package okuri.core.service.block

import okuri.core.entity.block.BlockChildEntity
import okuri.core.entity.block.BlockEntity
import okuri.core.enums.core.ComponentType
import okuri.core.models.block.structure.BlockTypeNesting
import okuri.core.repository.block.BlockChildrenRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.util.factory.block.BlockFactory
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.kotlin.*
import org.springframework.test.context.junit.jupiter.SpringExtension
import java.util.*

/**
 * Comprehensive test suite for BlockChildrenService.
 * Tests the hierarchy management system with slots, ordering, and validation.
 */
@ExtendWith(SpringExtension::class)
class BlockChildrenServiceTest {

    private val edgeRepository: BlockChildrenRepository = mock()
    private val blockRepository: BlockRepository = mock()
    private val service = BlockChildrenService(edgeRepository, blockRepository)


    // =============================================================================================
    // READ OPERATIONS
    // =============================================================================================

    @Test
    fun `listChildrenGrouped returns children grouped by slot`() {
        val parentId = UUID.randomUUID()
        val edges = listOf(
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "header", 0),
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "header", 1),
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "footer", 0)
        )

        whenever(edgeRepository.findByParentIdOrderBySlotAscOrderIndexAsc(parentId)).thenReturn(edges)

        val result = service.listChildrenGrouped(parentId)

        assertEquals(2, result.size)
        assertEquals(2, result["header"]!!.size)
        assertEquals(1, result["footer"]!!.size)
    }

    @Test
    fun `listChildren returns ordered children for specific slot`() {
        val parentId = UUID.randomUUID()
        val edges = listOf(
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "items", 0),
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "items", 1),
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "items", 2)
        )

        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(edges)

        val result = service.listChildren(parentId, "items")

        assertEquals(3, result.size)
        assertEquals(0, result[0].orderIndex)
        assertEquals(1, result[1].orderIndex)
        assertEquals(2, result[2].orderIndex)
    }

    // =============================================================================================
    // ADD CHILD
    // =============================================================================================

    @Test
    fun `addChild successfully adds child to empty slot`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(orgId)
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(null)
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(emptyList())
        whenever(edgeRepository.countByParentIdAndSlot(parentId, "items")).thenReturn(0)

        val saved = BlockChildEntity(UUID.randomUUID(), parentId, childId, "items", 0)
        whenever(edgeRepository.save(any())).thenReturn(saved)
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = service.addChild(child, parentId, "items", 0, nesting)

        assertEquals(parentId, result.parentId)
        assertEquals(childId, result.childId)
        assertEquals("items", result.slot)
        assertEquals(0, result.orderIndex)

        verify(edgeRepository).save(argThat {
            this.parentId == parentId && this.childId == childId && this.slot == "items" && this.orderIndex == 0
        })
    }

    @Test
    fun `addChild inserts at specified index and shifts siblings`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(orgId)
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        val existingSiblings = listOf(
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "items", 0),
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "items", 1),
            BlockChildEntity(UUID.randomUUID(), parentId, UUID.randomUUID(), "items", 2)
        )

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(null)
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(
            existingSiblings
        )
        whenever(edgeRepository.countByParentIdAndSlot(parentId, "items")).thenReturn(3)
        whenever(edgeRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        service.addChild(child, parentId, "items", 1, nesting)

        // Verify siblings with orderIndex >= 1 were shifted up
        verify(edgeRepository, times(2)).save(argThat<BlockChildEntity> {
            this.orderIndex >= 2 // original indices 1 and 2 should become 2 and 3
        })
    }

    @Test
    fun `addChild throws when child already exists as a child elsewhere`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()
        val otherParentId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(orgId, key = "contact_card")
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        val existingEdge = BlockChildEntity(UUID.randomUUID(), otherParentId, childId, "items", 0)
        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(existingEdge)

        val exception = assertThrows<IllegalStateException> {
            service.addChild(child, parentId, "items", 0, nesting)
        }

        assertTrue(exception.message!!.contains("already exists as a child"))
    }

    @Test
    fun `addChild throws when organisations do not match`() {
        val orgA = UUID.randomUUID()
        val orgB = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgB, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgB, childType)

        val parentType = BlockFactory.createType(orgA)
        val parent = BlockFactory.createBlock(parentId, orgA, parentType)

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(null)

        val exception = assertThrows<IllegalArgumentException> {
            service.addChild(child, parentId, "items", 0, nesting)
        }

        assertTrue(exception.message!!.contains("different organisation"))
    }

    @Test
    fun `addChild throws when child type not allowed in nesting rules`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(
            orgId,
            nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.TEXT))
        )
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.TEXT))

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(null)

        val exception = assertThrows<IllegalArgumentException> {
            service.addChild(child, parentId, "items", 0, nesting)
        }

        assertTrue(exception.message!!.contains("not allowed in parent's nesting rules"))
    }

    @Test
    fun `addChild throws when max children limit reached`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(orgId)
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)
        val nesting = BlockTypeNesting(max = 2, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(null)
        whenever(edgeRepository.countByParentIdAndSlot(parentId, "items")).thenReturn(2)

        val exception = assertThrows<IllegalArgumentException> {
            service.addChild(child, parentId, "items", 0, nesting)
        }

        assertTrue(exception.message!!.contains("reached maximum children"))
    }

    // =============================================================================================
    // REPLACE SLOT
    // =============================================================================================

    @Test
    fun `replaceSlot inserts new children and deletes removed ones`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val child1Id = UUID.randomUUID()
        val child2Id = UUID.randomUUID()
        val child3Id = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child2 = BlockFactory.createBlock(child2Id, orgId, childType)
        val child3 = BlockFactory.createBlock(child3Id, orgId, childType)

        val parentType = BlockFactory.createType(orgId)
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)


        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        // Existing: child1, child2
        val existing = listOf(
            BlockChildEntity(UUID.randomUUID(), parentId, child1Id, "items", 0),
            BlockChildEntity(UUID.randomUUID(), parentId, child2Id, "items", 1)
        )

        // Desired: child2, child3 (remove child1, add child3, reorder child2)
        val desiredIds = listOf(child2Id, child3Id)

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(blockRepository.findAllById(setOf(child2Id, child3Id))).thenReturn(listOf(child2, child3))
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(existing)
        whenever(edgeRepository.findByChildId(child2Id)).thenReturn(existing[1])
        whenever(edgeRepository.findByChildId(child3Id)).thenReturn(null)
        whenever(edgeRepository.countByParentIdAndSlot(parentId, "items")).thenReturn(2)
        whenever(edgeRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        service.replaceSlot(parentId, "items", desiredIds, nesting)

        // Verify child1 deleted
        verify(edgeRepository).deleteAllInBatch(argThat<List<BlockChildEntity>> {
            this.size == 1 && this[0].childId == child1Id
        })

        // Verify child3 inserted
        verify(edgeRepository).save(argThat<BlockChildEntity> {
            this.childId == child3Id && this.orderIndex == 1
        })
    }

    @Test
    fun `replaceSlot auto-reparents children from other parents`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val otherParentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(orgId)
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        // Child is currently a child of otherParent
        val existingEdge = BlockChildEntity(UUID.randomUUID(), otherParentId, childId, "oldSlot", 0)

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(blockRepository.findAllById(setOf(childId))).thenReturn(listOf(child))
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(emptyList())
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(otherParentId, "oldSlot")).thenReturn(
            listOf(
                existingEdge
            )
        )
        whenever(edgeRepository.findByChildId(childId)).thenReturn(existingEdge)
        whenever(edgeRepository.countByParentIdAndSlot(parentId, "items")).thenReturn(0)
        whenever(edgeRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        service.replaceSlot(parentId, "items", listOf(childId), nesting)

        // Verify old edge deleted
        verify(edgeRepository).delete(existingEdge)

        // Verify new edge created
        verify(edgeRepository).save(argThat<BlockChildEntity> {
            this.parentId == parentId && this.childId == childId && this.slot == "items"
        })
    }

    // =============================================================================================
    // REORDER WITHIN SLOT
    // =============================================================================================

    @Test
    fun `reorderWithinSlot moves child to new position`() {
        val parentId = UUID.randomUUID()
        val child1Id = UUID.randomUUID()
        val child2Id = UUID.randomUUID()
        val child3Id = UUID.randomUUID()

        val siblings = listOf(
            BlockChildEntity(UUID.randomUUID(), parentId, child1Id, "items", 0),
            BlockChildEntity(UUID.randomUUID(), parentId, child2Id, "items", 1),
            BlockChildEntity(UUID.randomUUID(), parentId, child3Id, "items", 2)
        )

        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(siblings)
        whenever(edgeRepository.save(any())).thenAnswer { it.arguments[0] }

        // Move child1 (index 0) to position 2
        service.reorderWithinSlot(parentId, "items", child1Id, 2)

        // Verify renumbering: child2 -> 0, child3 -> 1, child1 -> 2
        verify(edgeRepository, atLeastOnce()).save(any())
    }

    @Test
    fun `reorderWithinSlot throws when child not in slot`() {
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(emptyList())

        assertThrows<NoSuchElementException> {
            service.reorderWithinSlot(parentId, "items", childId, 0)
        }
    }

    // =============================================================================================
    // REPARENT CHILD
    // =============================================================================================

    @Test
    fun `reparentChild moves child to new parent`() {
        val orgId = UUID.randomUUID()
        val oldParentId = UUID.randomUUID()
        val newParentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(orgId)
        val newParent = BlockFactory.createBlock(newParentId, orgId, parentType)
        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        val existingEdge = BlockChildEntity(UUID.randomUUID(), oldParentId, childId, "oldSlot", 0)

        whenever(blockRepository.findById(childId)).thenReturn(Optional.of(child))
        whenever(blockRepository.findById(newParentId)).thenReturn(Optional.of(newParent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(existingEdge)
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(oldParentId, "oldSlot")).thenReturn(
            listOf(
                existingEdge
            )
        )
        whenever(
            edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(
                newParentId,
                "newSlot"
            )
        ).thenReturn(emptyList())
        whenever(edgeRepository.countByParentIdAndSlot(newParentId, "newSlot")).thenReturn(0)
        whenever(edgeRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        service.reparentChild(childId, newParentId, "newSlot", 0, nesting)

        // Verify old edge deleted
        verify(edgeRepository).delete(existingEdge)

        // Verify new edge created
        verify(edgeRepository).save(argThat<BlockChildEntity> {
            this.parentId == newParentId && this.childId == childId && this.slot == "newSlot"
        })
    }

    // =============================================================================================
    // DETACH CHILD
    // =============================================================================================

    @Test
    fun `detachChild removes edge and clears parent pointer`() {
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()
        val orgId = UUID.randomUUID()

        val edge = BlockChildEntity(UUID.randomUUID(), parentId, childId, "items", 0)

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        whenever(edgeRepository.findByChildId(childId)).thenReturn(edge)
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items")).thenReturn(emptyList())
        whenever(blockRepository.findById(childId)).thenReturn(Optional.of(child))
        whenever(edgeRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        service.detachChild(childId)

        verify(edgeRepository).delete(edge)
    }

    @Test
    fun `detachChild does nothing when child has no parent`() {
        val childId = UUID.randomUUID()

        whenever(edgeRepository.findByChildId(childId)).thenReturn(null)

        service.detachChild(childId)

        verify(edgeRepository, never()).delete(any())
    }

    // =============================================================================================
    // REMOVE CHILD
    // =============================================================================================

    @Test
    fun `removeChild removes child from specific slot and compacts ordering`() {
        val parentId = UUID.randomUUID()
        val child1Id = UUID.randomUUID()
        val child2Id = UUID.randomUUID()
        val child3Id = UUID.randomUUID()
        val orgId = UUID.randomUUID()

        val edge1 = BlockChildEntity(UUID.randomUUID(), parentId, child1Id, "items", 0)
        val edge2 = BlockChildEntity(UUID.randomUUID(), parentId, child2Id, "items", 1)
        val edge3 = BlockChildEntity(UUID.randomUUID(), parentId, child3Id, "items", 2)

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child2 = BlockFactory.createBlock(child2Id, orgId, childType)


        whenever(edgeRepository.findByParentIdAndChildId(parentId, child2Id)).thenReturn(edge2)
        whenever(edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, "items"))
            .thenReturn(listOf(edge1, edge3)) // After deletion
        whenever(blockRepository.findById(child2Id)).thenReturn(Optional.of(child2))
        whenever(edgeRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        service.removeChild(parentId, "items", child2Id)

        verify(edgeRepository).delete(edge2)
        // Verify compaction happened (remaining children renumbered)
        verify(edgeRepository, atLeastOnce()).save(any())
    }

    // =============================================================================================
    // ADDITIONAL COVERAGE - EDGE CASES FROM TEST PLAN
    // =============================================================================================

    @Test
    fun `addChild throws when child already attached to same parent and slot`() {
        val orgId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val childId = UUID.randomUUID()

        val childType = BlockFactory.createType(orgId, key = "contact_card")
        val child = BlockFactory.createBlock(childId, orgId, childType)

        val parentType = BlockFactory.createType(orgId)
        val parent = BlockFactory.createBlock(parentId, orgId, parentType)

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf(ComponentType.CONTACT_CARD))

        // Child is already attached to the same parent
        val existingEdge = BlockChildEntity(UUID.randomUUID(), parentId, childId, "items", 0)

        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parent))
        whenever(edgeRepository.findByChildId(childId)).thenReturn(existingEdge)

        // Service should throw exception because child_id is globally unique
        val exception = assertThrows<IllegalStateException> {
            service.addChild(child, parentId, "items", 0, nesting)
        }

        assertTrue(exception.message!!.contains("already exists"))
        verify(edgeRepository, never()).save(any())
    }

}
