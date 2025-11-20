package okuri.core.service.block

import io.github.oshai.kotlinlogging.KLogger
import okuri.core.configuration.auth.OrganisationSecurity
import okuri.core.entity.block.BlockChildEntity
import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTreeLayoutEntity
import okuri.core.enums.block.structure.BlockValidationScope
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.models.block.request.StructuralOperationRequest
import okuri.core.repository.block.BlockChildrenRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.repository.block.BlockTreeLayoutRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.util.OrganisationRole
import okuri.core.service.util.WithUserPersona
import okuri.core.service.util.factory.block.BlockFactory
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.time.ZonedDateTime
import java.util.*

@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@example.com",
    displayName = "Test User",
    roles = [
        OrganisationRole(
            organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = OrganisationRoles.ADMIN
        )
    ]
)
@SpringBootTest(
    classes = [
        AuthTokenService::class,
        OrganisationSecurity::class,
        BlockEnvironmentServiceTest.TestConfig::class,
        BlockEnvironmentService::class
    ]
)
class BlockEnvironmentServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(OrganisationSecurity::class)
    class TestConfig

    @MockitoBean
    private lateinit var blockService: BlockService

    @MockitoBean
    private lateinit var blockTreeLayoutService: BlockTreeLayoutService

    @MockitoBean
    private lateinit var blockChildrenService: BlockChildrenService

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var blockEnvironmentService: BlockEnvironmentService

    private val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

    // Helper to create a block type for tests
    private fun createTestBlockType() = BlockFactory.createType(
        orgId = orgId,
        key = "test_block",
        version = 1,
        strictness = BlockValidationScope.SOFT
    ).toModel()

    // ------------------------------------------------------------------
    // reduceBlockOperations: Edge cases
    // ------------------------------------------------------------------

    @Test
    fun `reduceBlockOperations with block added then removed returns empty list`() {
        // Scenario: A block is added at t1, then removed at t2
        // Expect: Both operations are skipped, empty list returned
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)

        val addOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val removeOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createRemoveOperation(blockId = blockId),
            timestamp = t2
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(addOp, removeOp))

        assertTrue(result.isEmpty(), "ADD followed by REMOVE should result in empty list")
    }

    @Test
    fun `reduceBlockOperations with block removed then added returns empty list`() {
        // Scenario: Operations arrive out of order - remove at t2, add at t1
        // Expect: Still treated as add+remove, returns empty list
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)

        val addOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val removeOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createRemoveOperation(blockId = blockId),
            timestamp = t2
        )

        // Pass in reverse order
        val result = blockEnvironmentService.reduceBlockOperations(listOf(removeOp, addOp))

        assertTrue(result.isEmpty(), "ADD + REMOVE (regardless of order) should result in empty list")
    }

    @Test
    fun `reduceBlockOperations with only remove operation returns remove operation`() {
        // Scenario: Only a remove operation exists (block existed prior to this batch)
        // Expect: Remove operation is returned
        val blockId = UUID.randomUUID()

        val removeOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createRemoveOperation(blockId = blockId),
            timestamp = ZonedDateTime.now()
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(removeOp))

        assertEquals(1, result.size)
        assertEquals(removeOp, result[0])
    }

    @Test
    fun `reduceBlockOperations with remove ignores other operations`() {
        // Scenario: Block has update and move operations, then is removed
        // Expect: Only remove operation is returned
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)
        val t3 = t2.plusSeconds(1)

        val updateOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val moveOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createMoveOperation(
                blockId = blockId,
                fromParentId = UUID.randomUUID(),
                toParentId = UUID.randomUUID()
            ),
            timestamp = t2
        )
        val removeOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createRemoveOperation(blockId = blockId),
            timestamp = t3
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(updateOp, moveOp, removeOp))

        assertEquals(1, result.size)
        assertEquals(removeOp, result[0])
    }

    @Test
    fun `reduceBlockOperations with add ensures add is first and drops ops before it`() {
        // Scenario: Block has update at t1, add at t2, update at t3
        // Expect: Only add at t2 and update at t3 are returned, add is first
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)
        val t3 = t2.plusSeconds(1)

        val earlyUpdateOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val addOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t2
        )
        val lateUpdateOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t3
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(earlyUpdateOp, addOp, lateUpdateOp))

        assertEquals(2, result.size)
        assertEquals(addOp, result[0], "ADD should be first")
        assertEquals(lateUpdateOp, result[1], "Late UPDATE should be second")
    }

    @Test
    fun `reduceBlockOperations keeps only last operation per type`() {
        // Scenario: Multiple updates and multiple reorders
        // Expect: Only the last update and last reorder are kept
        val blockId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)
        val t3 = t2.plusSeconds(1)
        val t4 = t3.plusSeconds(1)

        val update1 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val reorder1 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createReorderOperation(
                blockId = blockId,
                parentId = parentId,
                fromIndex = 0,
                toIndex = 1
            ),
            timestamp = t2
        )
        val update2 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t3
        )
        val reorder2 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createReorderOperation(
                blockId = blockId,
                parentId = parentId,
                fromIndex = 1,
                toIndex = 2
            ),
            timestamp = t4
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(update1, reorder1, update2, reorder2))

        assertEquals(2, result.size)
        // Results should be sorted by timestamp
        assertEquals(update2, result[0], "Should keep last UPDATE")
        assertEquals(reorder2, result[1], "Should keep last REORDER")
    }

    @Test
    fun `reduceBlockOperations with add plus other operations keeps all with add first`() {
        // Scenario: Block is added, then updated, moved, and reordered
        // Expect: All operations kept, ADD is first, others sorted by timestamp
        val blockId = UUID.randomUUID()
        val parentId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)
        val t3 = t2.plusSeconds(1)
        val t4 = t3.plusSeconds(1)

        val addOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val updateOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t2
        )
        val moveOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createMoveOperation(
                blockId = blockId,
                fromParentId = UUID.randomUUID(),
                toParentId = UUID.randomUUID()
            ),
            timestamp = t3
        )
        val reorderOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createReorderOperation(
                blockId = blockId,
                parentId = parentId,
                fromIndex = 0,
                toIndex = 1
            ),
            timestamp = t4
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(addOp, updateOp, moveOp, reorderOp))

        assertEquals(4, result.size)
        assertEquals(addOp, result[0], "ADD should be first")
        assertEquals(updateOp, result[1], "UPDATE should be second")
        assertEquals(moveOp, result[2], "MOVE should be third")
        assertEquals(reorderOp, result[3], "REORDER should be fourth")
    }

    @Test
    fun `reduceBlockOperations with empty list returns empty list`() {
        val result = blockEnvironmentService.reduceBlockOperations(emptyList())
        assertTrue(result.isEmpty())
    }

    @Test
    fun `reduceBlockOperations with single operation returns that operation`() {
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val updateOp = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = ZonedDateTime.now()
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(updateOp))

        assertEquals(1, result.size)
        assertEquals(updateOp, result[0])
    }

    @Test
    fun `reduceBlockOperations handles multiple adds by keeping the last one`() {
        // Scenario: Multiple ADD operations (unusual but possible)
        // Expect: Only the last ADD is kept
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)

        val add1 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val add2 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t2
        )

        val result = blockEnvironmentService.reduceBlockOperations(listOf(add1, add2))

        assertEquals(1, result.size)
        assertEquals(add2, result[0], "Should keep last ADD")
    }

    // ------------------------------------------------------------------
    // normalizeOperations: Edge cases
    // ------------------------------------------------------------------

    @Test
    fun `normalizeOperations with empty list returns empty map`() {
        val result = blockEnvironmentService.normalizeOperations(emptyList())
        assertTrue(result.isEmpty())
    }

    @Test
    fun `normalizeOperations groups operations by blockId`() {
        // Scenario: Two blocks, each with different operations
        // Expect: Map with two entries, each containing reduced operations for that block
        val block1Id = UUID.randomUUID()
        val block2Id = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)

        val block1Update = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = block1Id, orgId = orgId, type = type),
            timestamp = t1
        )
        val block2Update = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = block2Id, orgId = orgId, type = type),
            timestamp = t2
        )

        val result = blockEnvironmentService.normalizeOperations(listOf(block1Update, block2Update))

        assertEquals(2, result.size)
        assertTrue(result.containsKey(block1Id))
        assertTrue(result.containsKey(block2Id))
        assertEquals(1, result[block1Id]?.size)
        assertEquals(1, result[block2Id]?.size)
    }

    @Test
    fun `normalizeOperations applies reduction rules per block`() {
        // Scenario: Block1 has add+remove (should be empty), Block2 has update+move (should keep both)
        // Expect: Map has only block2 entry (block1 was reduced to nothing)
        val block1Id = UUID.randomUUID()
        val block2Id = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)
        val t3 = t2.plusSeconds(1)
        val t4 = t3.plusSeconds(1)

        val block1Add = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = block1Id, orgId = orgId, type = type),
            timestamp = t1
        )
        val block1Remove = BlockFactory.createOperationRequest(
            operation = BlockFactory.createRemoveOperation(blockId = block1Id),
            timestamp = t2
        )
        val block2Update = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = block2Id, orgId = orgId, type = type),
            timestamp = t3
        )
        val block2Move = BlockFactory.createOperationRequest(
            operation = BlockFactory.createMoveOperation(
                blockId = block2Id,
                fromParentId = UUID.randomUUID(),
                toParentId = UUID.randomUUID()
            ),
            timestamp = t4
        )

        val result = blockEnvironmentService.normalizeOperations(
            listOf(block1Add, block1Remove, block2Update, block2Move)
        )

        assertEquals(1, result.size, "Block1 should be removed (empty after reduction)")
        assertTrue(result.containsKey(block2Id))
        assertEquals(2, result[block2Id]?.size)
    }

    @Test
    fun `normalizeOperations sorts results by timestamp within each block`() {
        // Scenario: Operations arrive out of order
        // Expect: Results are sorted by timestamp
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)
        val t3 = t2.plusSeconds(1)

        val update1 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t3  // Latest
        )
        val update2 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1  // Earliest
        )
        val update3 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t2  // Middle
        )

        // Pass in random order
        val result = blockEnvironmentService.normalizeOperations(listOf(update1, update2, update3))

        assertEquals(1, result.size)
        assertEquals(1, result[blockId]?.size, "Should only keep the last update (t3)")
        assertEquals(update1, result[blockId]?.get(0), "Should keep the latest update")
    }

    @Test
    fun `normalizeOperations handles complex multi-block scenario`() {
        // Scenario: 3 blocks with different operation patterns
        // - Block A: add, update, update → should keep add + last update
        // - Block B: update, remove → should keep only remove
        // - Block C: add, remove → should be empty (removed from results)
        val blockAId = UUID.randomUUID()
        val blockBId = UUID.randomUUID()
        val blockCId = UUID.randomUUID()
        val type = createTestBlockType()

        val baseTime = ZonedDateTime.now()

        // Block A operations
        val aAdd = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockAId, orgId = orgId, type = type),
            timestamp = baseTime
        )
        val aUpdate1 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockAId, orgId = orgId, type = type),
            timestamp = baseTime.plusSeconds(1)
        )
        val aUpdate2 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockAId, orgId = orgId, type = type),
            timestamp = baseTime.plusSeconds(2)
        )

        // Block B operations
        val bUpdate = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockBId, orgId = orgId, type = type),
            timestamp = baseTime.plusSeconds(3)
        )
        val bRemove = BlockFactory.createOperationRequest(
            operation = BlockFactory.createRemoveOperation(blockId = blockBId),
            timestamp = baseTime.plusSeconds(4)
        )

        // Block C operations
        val cAdd = BlockFactory.createOperationRequest(
            operation = BlockFactory.createAddOperation(blockId = blockCId, orgId = orgId, type = type),
            timestamp = baseTime.plusSeconds(5)
        )
        val cRemove = BlockFactory.createOperationRequest(
            operation = BlockFactory.createRemoveOperation(blockId = blockCId),
            timestamp = baseTime.plusSeconds(6)
        )

        val result = blockEnvironmentService.normalizeOperations(
            listOf(aAdd, aUpdate1, aUpdate2, bUpdate, bRemove, cAdd, cRemove)
        )

        assertEquals(2, result.size, "Only blocks A and B should remain")

        // Check Block A
        assertTrue(result.containsKey(blockAId))
        assertEquals(2, result[blockAId]?.size)
        assertEquals(aAdd, result[blockAId]?.get(0), "Block A should start with ADD")
        assertEquals(aUpdate2, result[blockAId]?.get(1), "Block A should have last UPDATE")

        // Check Block B
        assertTrue(result.containsKey(blockBId))
        assertEquals(1, result[blockBId]?.size)
        assertEquals(bRemove, result[blockBId]?.get(0), "Block B should only have REMOVE")

        // Check Block C is not present
        assertFalse(result.containsKey(blockCId), "Block C should be removed (add+remove)")
    }

    @Test
    fun `normalizeOperations with single block delegates to reduceBlockOperations`() {
        // Scenario: Single block with multiple operations
        // Expect: Same behavior as reduceBlockOperations
        val blockId = UUID.randomUUID()
        val type = createTestBlockType()

        val t1 = ZonedDateTime.now()
        val t2 = t1.plusSeconds(1)

        val update1 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t1
        )
        val update2 = BlockFactory.createOperationRequest(
            operation = BlockFactory.createUpdateOperation(blockId = blockId, orgId = orgId, type = type),
            timestamp = t2
        )

        val normalizeResult = blockEnvironmentService.normalizeOperations(listOf(update1, update2))
        val reduceResult = blockEnvironmentService.reduceBlockOperations(listOf(update1, update2))

        assertEquals(1, normalizeResult.size)
        assertEquals(reduceResult, normalizeResult[blockId])
    }
}
