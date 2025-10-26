package okuri.core.service.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockReferenceFetchPolicy
import okuri.core.enums.block.BlockReferenceWarning
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Block
import okuri.core.models.block.Referenceable
import okuri.core.models.block.structure.*
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.service.block.resolvers.ReferenceResolver
import okuri.core.service.util.factory.block.BlockFactory
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.kotlin.*
import org.springframework.test.context.junit.jupiter.SpringExtension
import java.util.*

/**
 * Comprehensive test suite for BlockReferenceService.
 * Tests external entity reference management with the new architecture.
 */
@ExtendWith(SpringExtension::class)
class BlockReferenceServiceTest {

    private val blockReferenceRepository: BlockReferenceRepository = mock()

    // Mock resolver for BLOCK type
    private val blockResolver = object : ReferenceResolver {
        override val type = EntityType.BLOCK
        override fun fetch(ids: Set<UUID>): Map<UUID, Referenceable<*>> {
            val orgId = UUID.randomUUID()
            val typeEntity = BlockFactory.createType(orgId)
            return ids.associateWith { id ->
                BlockEntity(
                    id = id,
                    organisationId = orgId,
                    type = typeEntity,
                    name = "Block-$id",
                    payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
                    parentId = null,
                    archived = false
                )
            }
        }
    }

    // Mock resolver for CLIENT type
    private val clientResolver = object : ReferenceResolver {
        override val type = EntityType.CLIENT
        override fun fetch(ids: Set<UUID>): Map<UUID, Referenceable<*>> {
            // Return mock client objects
            return ids.associateWith { id ->
                object : Referenceable<Any> {
                    override fun toReference(): Any = mapOf("id" to id, "name" to "Client-$id")
                }
            }
        }
    }

    private fun serviceWithResolvers(resolvers: List<ReferenceResolver> = listOf(blockResolver, clientResolver)) =
        BlockReferenceService(blockReferenceRepository, resolvers)

    // =============================================================================================
    // UPSERT ENTITY REFERENCES
    // =============================================================================================

    @Test
    fun `upsertLinksFor creates new reference rows for entity list`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        val client1Id = UUID.randomUUID()
        val client2Id = UUID.randomUUID()

        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.CLIENT, id = client1Id),
                ReferenceItem(type = EntityType.CLIENT, id = client2Id)
            ),
            path = "\$.items",
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.items")).thenReturn(emptyList())
        whenever(blockReferenceRepository.saveAll(any<List<BlockReferenceEntity>>())).thenAnswer { it.arguments[0] }

        val service = serviceWithResolvers()
        service.upsertLinksFor(block, metadata)

        verify(blockReferenceRepository).saveAll(argThat<List<BlockReferenceEntity>> { rows ->
            rows.size == 2 &&
                    rows[0].entityType == EntityType.CLIENT &&
                    rows[0].entityId == client1Id &&
                    rows[0].path == "\$.items[0]" &&
                    rows[0].orderIndex == 0 &&
                    rows[1].entityId == client2Id &&
                    rows[1].path == "\$.items[1]" &&
                    rows[1].orderIndex == 1
        })
    }

    @Test
    fun `upsertLinksFor performs delta upsert - adds, updates, deletes`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        val client1Id = UUID.randomUUID()
        val client2Id = UUID.randomUUID()
        val client3Id = UUID.randomUUID()

        // Existing: client1 at [0], client2 at [1]
        val existing = listOf(
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                parentId = blockId,
                entityType = EntityType.CLIENT,
                entityId = client1Id,
                path = "\$.items[0]",
                orderIndex = 0
            ),
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                parentId = blockId,
                entityType = EntityType.CLIENT,
                entityId = client2Id,
                path = "\$.items[1]",
                orderIndex = 1
            )
        )

        // Desired: client2 at [0], client3 at [1]
        // Should: delete both client1 and client2 (because client2's path changes from [1] to [0]),
        // then insert client2 at new path [0] and client3 at [1]
        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.CLIENT, id = client2Id),
                ReferenceItem(type = EntityType.CLIENT, id = client3Id)
            ),
            path = "\$.items",
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.items")).thenReturn(existing)
        whenever(blockReferenceRepository.saveAll(any<List<BlockReferenceEntity>>())).thenAnswer { it.arguments[0] }

        val service = serviceWithResolvers()
        service.upsertLinksFor(block, metadata)

        // Verify both client1 and client2 deleted (client2 path changes from [1] to [0])
        verify(blockReferenceRepository).deleteAllInBatch(argThat<List<BlockReferenceEntity>> { rows ->
            rows.size == 2 &&
                    rows.any { it.entityId == client1Id } &&
                    rows.any { it.entityId == client2Id }
        })

        // Verify client2 re-inserted at new index 0 and client3 inserted at index 1
        verify(blockReferenceRepository).saveAll(argThat<List<BlockReferenceEntity>> { rows ->
            rows.size == 2 &&
                    rows.any { it.entityId == client2Id && it.orderIndex == 0 && it.path == "\$.items[0]" } &&
                    rows.any { it.entityId == client3Id && it.orderIndex == 1 && it.path == "\$.items[1]" }
        })
    }

    @Test
    fun `upsertLinksFor throws when duplicates not allowed`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        val clientId = UUID.randomUUID()

        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.CLIENT, id = clientId),
                ReferenceItem(type = EntityType.CLIENT, id = clientId) // Duplicate
            ),
            path = "\$.items",
            allowDuplicates = false,
            meta = BlockMeta()
        )

        val service = serviceWithResolvers()

        val exception = assertThrows<IllegalArgumentException> {
            service.upsertLinksFor(block, metadata)
        }

        assertTrue(exception.message!!.contains("Duplicate references are not allowed"))
    }

    @Test
    fun `upsertLinksFor throws when items include BLOCK type`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.BLOCK, id = UUID.randomUUID()) // Not allowed in EntityReferenceMetadata
            ),
            path = "\$.items",
            meta = BlockMeta()
        )

        val service = serviceWithResolvers()

        val exception = assertThrows<IllegalArgumentException> {
            service.upsertLinksFor(block, metadata)
        }

        assertTrue(exception.message!!.contains("cannot include BLOCK references"))
    }

    // =============================================================================================
    // FIND LIST REFERENCES
    // =============================================================================================

    @Test
    fun `findListReferences returns LAZY references with metadata only`() {
        UUID.randomUUID()
        val blockId = UUID.randomUUID()

        val client1Id = UUID.randomUUID()
        val client2Id = UUID.randomUUID()

        val rows = listOf(
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                parentId = blockId,
                entityType = EntityType.CLIENT,
                entityId = client1Id,
                path = "\$.items[0]",
                orderIndex = 0
            ),
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                parentId = blockId,
                entityType = EntityType.CLIENT,
                entityId = client2Id,
                path = "\$.items[1]",
                orderIndex = 1
            )
        )

        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.CLIENT, id = client1Id),
                ReferenceItem(type = EntityType.CLIENT, id = client2Id)
            ),
            path = "\$.items",
            fetchPolicy = BlockReferenceFetchPolicy.LAZY,
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.items")).thenReturn(rows)

        val service = serviceWithResolvers()
        val result = service.findListReferences(blockId, metadata)

        assertEquals(2, result.size)
        assertEquals(EntityType.CLIENT, result[0].entityType)
        assertEquals(client1Id, result[0].entityId)
        assertNull(result[0].entity) // LAZY - entity not loaded
        assertEquals(BlockReferenceWarning.REQUIRES_LOADING, result[0].warning)
    }

    @Test
    fun `findListReferences EAGER loads entities via resolvers`() {
        UUID.randomUUID()
        val blockId = UUID.randomUUID()

        val client1Id = UUID.randomUUID()
        val client2Id = UUID.randomUUID()

        val rows = listOf(
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                parentId = blockId,
                entityType = EntityType.CLIENT,
                entityId = client1Id,
                path = "\$.items[0]",
                orderIndex = 0
            ),
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                parentId = blockId,
                entityType = EntityType.CLIENT,
                entityId = client2Id,
                path = "\$.items[1]",
                orderIndex = 1
            )
        )

        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.CLIENT, id = client1Id),
                ReferenceItem(type = EntityType.CLIENT, id = client2Id)
            ),
            path = "\$.items",
            fetchPolicy = BlockReferenceFetchPolicy.EAGER,
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.items")).thenReturn(rows)

        val service = serviceWithResolvers()
        val result = service.findListReferences(blockId, metadata)

        assertEquals(2, result.size)
        assertNotNull(result[0].entity) // EAGER - entity loaded
        assertNotNull(result[1].entity)
        assertNull(result[0].warning)
        assertNull(result[1].warning)
    }

    @Test
    fun `findListReferences returns MISSING warning when reference not in database`() {
        UUID.randomUUID()
        val blockId = UUID.randomUUID()

        val clientId = UUID.randomUUID()

        // Metadata references a client, but no row in database
        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.CLIENT, id = clientId)
            ),
            path = "\$.items",
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.items")).thenReturn(emptyList())

        val service = serviceWithResolvers()
        val result = service.findListReferences(blockId, metadata)

        assertEquals(1, result.size)
        assertNull(result[0].id) // No database row
        assertEquals(EntityType.CLIENT, result[0].entityType)
        assertEquals(clientId, result[0].entityId)
        assertNull(result[0].entity)
        assertEquals(BlockReferenceWarning.MISSING, result[0].warning)
    }

    @Test
    fun `findListReferences returns UNSUPPORTED warning when no resolver available`() {
        UUID.randomUUID()
        val blockId = UUID.randomUUID()

        val projectId = UUID.randomUUID()

        val rows = listOf(
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                parentId = blockId,
                entityType = EntityType.PROJECT,
                entityId = projectId,
                path = "\$.items[0]",
                orderIndex = 0
            )
        )

        val metadata = EntityReferenceMetadata(
            items = listOf(
                ReferenceItem(type = EntityType.PROJECT, id = projectId)
            ),
            path = "\$.items",
            fetchPolicy = BlockReferenceFetchPolicy.EAGER,
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.items")).thenReturn(rows)

        // Service has no PROJECT resolver
        val service = serviceWithResolvers(listOf(clientResolver))
        val result = service.findListReferences(blockId, metadata)

        assertEquals(1, result.size)
        assertNull(result[0].entity)
        assertEquals(BlockReferenceWarning.UNSUPPORTED, result[0].warning)
    }

    // =============================================================================================
    // UPSERT BLOCK LINK
    // =============================================================================================

    @Test
    fun `upsertBlockLinkFor creates single block reference`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val referencedBlockId = UUID.randomUUID()

        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        val metadata = BlockReferenceMetadata(
            item = ReferenceItem(type = EntityType.BLOCK, id = referencedBlockId),
            path = "\$.block",
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.block")).thenReturn(emptyList())
        whenever(blockReferenceRepository.save(any())).thenAnswer { it.arguments[0] }

        val service = serviceWithResolvers()
        service.upsertBlockLinkFor(block, metadata)

        verify(blockReferenceRepository).save(argThat<BlockReferenceEntity> {
            this.parentId == blockId &&
                    this.entityType == EntityType.BLOCK &&
                    this.entityId == referencedBlockId &&
                    this.path == "\$.block" &&
                    this.orderIndex == null
        })
    }

    @Test
    fun `upsertBlockLinkFor updates existing block reference`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val oldReferencedBlockId = UUID.randomUUID()
        val newReferencedBlockId = UUID.randomUUID()

        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        val existingRow = BlockReferenceEntity(
            id = UUID.randomUUID(),
            parentId = blockId,
            entityType = EntityType.BLOCK,
            entityId = oldReferencedBlockId,
            path = "\$.block",
            orderIndex = null
        )

        val metadata = BlockReferenceMetadata(
            item = ReferenceItem(type = EntityType.BLOCK, id = newReferencedBlockId),
            path = "\$.block",
            meta = BlockMeta()
        )

        whenever(
            blockReferenceRepository.findByBlockIdAndPathPrefix(
                blockId,
                "\$.block"
            )
        ).thenReturn(listOf(existingRow))
        whenever(blockReferenceRepository.save(any())).thenAnswer { it.arguments[0] }

        val service = serviceWithResolvers()
        service.upsertBlockLinkFor(block, metadata)

        verify(blockReferenceRepository).save(argThat<BlockReferenceEntity> {
            this.id == existingRow.id &&
                    this.entityId == newReferencedBlockId
        })
    }

    @Test
    fun `upsertBlockLinkFor throws when item is not BLOCK type`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()

        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        val metadata = BlockReferenceMetadata(
            item = ReferenceItem(type = EntityType.CLIENT, id = UUID.randomUUID()), // Should be BLOCK
            path = "\$.block",
            meta = BlockMeta()
        )

        val service = serviceWithResolvers()

        val exception = assertThrows<IllegalArgumentException> {
            service.upsertBlockLinkFor(block, metadata)
        }

        assertTrue(exception.message!!.contains("must be type BLOCK"))
    }

    @Test
    fun `upsertBlockLinkFor throws when multiple rows found at path`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()

        val type = BlockFactory.createType(orgId)
        val block = BlockFactory.createBlock(blockId, orgId, type)

        // Multiple rows at single-link path (data corruption scenario)
        val existing = listOf(
            BlockReferenceEntity(UUID.randomUUID(), blockId, EntityType.BLOCK, UUID.randomUUID(), "\$.block", null),
            BlockReferenceEntity(UUID.randomUUID(), blockId, EntityType.BLOCK, UUID.randomUUID(), "\$.block", null)
        )

        val metadata = BlockReferenceMetadata(
            item = ReferenceItem(type = EntityType.BLOCK, id = UUID.randomUUID()),
            path = "\$.block",
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.block")).thenReturn(existing)

        val service = serviceWithResolvers()

        val exception = assertThrows<IllegalArgumentException> {
            service.upsertBlockLinkFor(block, metadata)
        }

        assertTrue(exception.message!!.contains("Multiple rows found"))
    }

    // =============================================================================================
    // FIND BLOCK LINK
    // =============================================================================================

    @Test
    fun `findBlockLink returns LAZY reference without loading block`() {
        UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val referencedBlockId = UUID.randomUUID()

        val row = BlockReferenceEntity(
            id = UUID.randomUUID(),
            parentId = blockId,
            entityType = EntityType.BLOCK,
            entityId = referencedBlockId,
            path = "\$.block",
            orderIndex = null
        )

        val metadata = BlockReferenceMetadata(
            item = ReferenceItem(type = EntityType.BLOCK, id = referencedBlockId),
            path = "\$.block",
            fetchPolicy = BlockReferenceFetchPolicy.LAZY,
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.block")).thenReturn(listOf(row))

        val service = serviceWithResolvers()
        val result = service.findBlockLink(blockId, metadata)

        assertNotNull(result.id)
        assertEquals(EntityType.BLOCK, result.entityType)
        assertEquals(referencedBlockId, result.entityId)
        assertNull(result.entity) // LAZY
        assertEquals(BlockReferenceWarning.REQUIRES_LOADING, result.warning)
    }

    @Test
    fun `findBlockLink EAGER loads referenced block`() {
        UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val referencedBlockId = UUID.randomUUID()

        val row = BlockReferenceEntity(
            id = UUID.randomUUID(),
            parentId = blockId,
            entityType = EntityType.BLOCK,
            entityId = referencedBlockId,
            path = "\$.block",
            orderIndex = null
        )

        val metadata = BlockReferenceMetadata(
            item = ReferenceItem(type = EntityType.BLOCK, id = referencedBlockId),
            path = "\$.block",
            fetchPolicy = BlockReferenceFetchPolicy.EAGER,
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.block")).thenReturn(listOf(row))

        val service = serviceWithResolvers()
        val result = service.findBlockLink(blockId, metadata)

        assertNotNull(result.entity) // EAGER - loaded
        assertTrue(result.entity is Block)
        assertEquals(referencedBlockId, result.entity!!.id)
        assertNull(result.warning)
    }

    @Test
    fun `findBlockLink returns MISSING warning when no row exists`() {
        UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val referencedBlockId = UUID.randomUUID()

        val metadata = BlockReferenceMetadata(
            item = ReferenceItem(type = EntityType.BLOCK, id = referencedBlockId),
            path = "\$.block",
            meta = BlockMeta()
        )

        whenever(blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, "\$.block")).thenReturn(emptyList())

        val service = serviceWithResolvers()
        val result = service.findBlockLink(blockId, metadata)

        assertNull(result.id)
        assertEquals(EntityType.BLOCK, result.entityType)
        assertEquals(referencedBlockId, result.entityId)
        assertNull(result.entity)
        assertEquals(BlockReferenceWarning.MISSING, result.warning)
    }
}
