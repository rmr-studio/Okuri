package okuri.core.service.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Referenceable
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.block.resolvers.ReferenceResolver
import okuri.core.service.util.factory.block.BlockFactory
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.kotlin.*
import org.springframework.test.context.junit.jupiter.SpringExtension
import java.util.*

@ExtendWith(SpringExtension::class)
class BlockReferenceServiceTest {

    private val blockReferenceRepository: BlockReferenceRepository = mock()
    private val blockRepository: BlockRepository = mock()

    // For loadReferences tests: register only BLOCK resolver to prove expansion; others remain unresolved (entity=null)
    private val blockResolver = object : ReferenceResolver {
        override val type = EntityType.BLOCK
        override fun fetch(ids: Set<UUID>): Map<UUID, Referenceable<*>> {
            // Return BlockEntity (implements Referenceable<Block>)
            val orgId = UUID.randomUUID()
            val type = BlockFactory.generateBlockType(orgId = orgId)
            val map = mutableMapOf<UUID, Referenceable<*>>()
            ids.forEach { id ->
                map[id] = BlockEntity(
                    id = id,
                    organisationId = orgId,
                    type = type,
                    name = "child-$id",
                    payload = okuri.core.models.block.structure.BlockMetadata(
                        data = emptyMap(), refs = emptyList(), meta = okuri.core.models.block.structure.BlockMeta()
                    ),
                    parent = null,
                    archived = false
                )
            }
            return map
        }
    }

    private fun serviceWithResolvers(resolvers: List<ReferenceResolver> = listOf(blockResolver)) =
        BlockReferenceService(blockReferenceRepository, blockRepository, resolvers)

    // -----------------------------------------------------------
    // upsertReferencesFor: sets parent for OWNED block refs
    // -----------------------------------------------------------
    @Test
    fun `upsertReferencesFor sets parent for OWNED block refs and writes rows`() {
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId = orgId)
        val parent = BlockFactory.generateBlock(orgId = orgId, type = type)
        val childId = UUID.randomUUID()
        val child = BlockFactory.generateBlock(orgId = orgId, type = type).copy(id = childId)

        // previous owned: none
        whenever(
            blockReferenceRepository.findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
                eq(parent.id!!), eq(BlockOwnership.OWNED), eq(EntityType.BLOCK)
            )
        ).thenReturn(emptyList())

        whenever(blockReferenceRepository.deleteByBlockId(parent.id!!)).then { }
        whenever(blockReferenceRepository.saveAll(any<List<BlockReferenceEntity>>())).thenAnswer { it.arguments[0] }

        whenever(blockRepository.findById(childId)).thenReturn(Optional.of(child))
        whenever(blockRepository.save(any<BlockEntity>())).thenAnswer { it.arguments[0] }

        val payloadData = mapOf(
            // $.data/addresses[0]
            "addresses" to listOf(
                mapOf("_refType" to "BLOCK", "_refId" to childId.toString(), "_ownership" to "OWNED")
            )
        )

        serviceWithResolvers().upsertReferencesFor(parent, payloadData)

        // verify one row saved and parent set
        verify(blockReferenceRepository).saveAll(check { rows: List<BlockReferenceEntity> ->
            assertEquals(1, rows.size)
            assertEquals(childId, rows[0].entityId)
            assertEquals("\$.data/addresses[0]", rows[0].path)
            assertEquals(BlockOwnership.OWNED, rows[0].ownership)
        })

        verify(blockRepository).save(check { updated ->
            assertEquals(parent.id, updated.parent?.id) // child.parent == parent
        })
    }

    // ------------------------------------------------------------------
    // upsertReferencesFor: delta unparent when a child is removed/linked
    // ------------------------------------------------------------------
    @Test
    fun `upsertReferencesFor unparents children no longer owned`() {
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId = orgId)
        val parent = BlockFactory.generateBlock(orgId = orgId, type = type)
        val formerlyOwnedChildId = UUID.randomUUID()
        val formerlyOwnedChild =
            BlockFactory.generateBlock(orgId = orgId, type = type).copy(id = formerlyOwnedChildId, parent = parent)

        // PREVIOUS owned edges (before delete)
        whenever(
            blockReferenceRepository.findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
                eq(parent.id!!), eq(BlockOwnership.OWNED), eq(EntityType.BLOCK)
            )
        ).thenReturn(
            listOf(
                BlockReferenceEntity(
                    id = UUID.randomUUID(), block = parent, entityType = EntityType.BLOCK,
                    entityId = formerlyOwnedChildId, ownership = BlockOwnership.OWNED,
                    path = "\$.data/contacts[0]", orderIndex = 0
                )
            )
        )

        whenever(blockRepository.findAllById(setOf(formerlyOwnedChildId))).thenReturn(listOf(formerlyOwnedChild))
        whenever(blockRepository.saveAll(any<List<BlockEntity>>())).thenAnswer { it.arguments[0] }

        // new payload: NO refs → should unparent previous
        whenever(blockReferenceRepository.deleteByBlockId(parent.id!!)).then { }
        whenever(blockReferenceRepository.saveAll(any<List<BlockReferenceEntity>>())).thenReturn(emptyList())

        serviceWithResolvers().upsertReferencesFor(parent, payloadData = emptyMap())

        verify(blockRepository).saveAll(check<List<BlockEntity>> { cleared ->
            assertEquals(1, cleared.size)
            assertNull(cleared[0].parent)
        })
    }

    // ---------------------------------------------------------------
    // upsertReferencesFor: cross-organisation OWNED is rejected
    // ---------------------------------------------------------------
    @Test
    fun `upsertReferencesFor rejects cross-org ownership`() {
        val orgA = UUID.randomUUID()
        val orgB = UUID.randomUUID()
        val typeA = BlockFactory.generateBlockType(orgId = orgA)
        val typeB = BlockFactory.generateBlockType(orgId = orgB)
        val parent = BlockFactory.generateBlock(orgId = orgA, type = typeA)
        val childId = UUID.randomUUID()
        val child = BlockFactory.generateBlock(orgId = orgB, type = typeB).copy(id = childId) // different org

        whenever(
            blockReferenceRepository.findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
                eq(parent.id!!), eq(BlockOwnership.OWNED), eq(EntityType.BLOCK)
            )
        ).thenReturn(emptyList())
        whenever(blockReferenceRepository.deleteByBlockId(parent.id!!)).then { }
        whenever(blockReferenceRepository.saveAll(any<List<BlockReferenceEntity>>())).thenAnswer { it.arguments[0] }

        whenever(blockRepository.findById(childId)).thenReturn(Optional.of(child))

        val payloadData = mapOf(
            "nested" to mapOf("_refType" to "BLOCK", "_refId" to childId.toString(), "_ownership" to "OWNED")
        )

        assertThrows<IllegalArgumentException> {
            serviceWithResolvers().upsertReferencesFor(parent, payloadData)
        }
    }

    // ------------------------------------------
    // loadReferences: expands BLOCK, leaves others
    // ------------------------------------------
    @Test
    fun `loadReferences expands BLOCK entities and leaves CLIENT unresolved`() {
        val orgId = UUID.randomUUID()
        val svc = serviceWithResolvers(listOf(blockResolver)) // only BLOCK resolver registered
        val type = BlockFactory.generateBlockType(orgId)
        val blockId = UUID.randomUUID()
        val blockChildId = UUID.randomUUID()
        val clientId = UUID.randomUUID()

        val rows = listOf(
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                block = BlockFactory.generateBlock(id = blockId, orgId = orgId, type = type),
                entityType = EntityType.BLOCK,
                entityId = blockChildId,
                ownership = BlockOwnership.LINKED,
                path = "\$.data/relatedBlocks[0]",
                orderIndex = 0
            ),
            BlockReferenceEntity(
                id = UUID.randomUUID(),
                block = BlockFactory.generateBlock(id = blockId, orgId = orgId, type = type),
                entityType = EntityType.CLIENT,
                entityId = clientId,
                ownership = BlockOwnership.LINKED,
                path = "\$.data/account",
                orderIndex = null
            )
        )

        whenever(blockReferenceRepository.findByBlockIdOrderByPathAscOrderIndexAsc(blockId)).thenReturn(rows)

        val refs = svc.loadReferences(blockId, expandTypes = setOf(EntityType.BLOCK, EntityType.CLIENT))

        // Assert: BLOCK ref has entity populated; CLIENT ref has entity null (no resolver)
        val blockRef = refs.first { it.entityType == EntityType.BLOCK }
        assertNotNull(blockRef.entity)

        val clientRef = refs.first { it.entityType == EntityType.CLIENT }
        assertNull(clientRef.entity)
    }

    // -----------------------------------------------
    // findOwnedBlocks: grouped by logical slot key
    // -----------------------------------------------
    @Test
    fun `findOwnedBlocks groups refs by slot key`() {
        val svc = serviceWithResolvers()
        val orgId = UUID.randomUUID()
        val type = BlockFactory.generateBlockType(orgId = orgId)
        val parent = BlockFactory.generateBlock(orgId = orgId, type = type)
        val c1 = UUID.randomUUID()
        val c2 = UUID.randomUUID()
        val rows = listOf(
            BlockReferenceEntity(
                id = UUID.randomUUID(), block = parent, entityType = EntityType.BLOCK,
                entityId = c1, ownership = BlockOwnership.OWNED, path = "\$.data/contacts[0]", orderIndex = 0
            ),
            BlockReferenceEntity(
                id = UUID.randomUUID(), block = parent, entityType = EntityType.BLOCK,
                entityId = c2, ownership = BlockOwnership.OWNED, path = "\$.data/contacts[1]", orderIndex = 1
            )
        )
        whenever(
            blockReferenceRepository.findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
                eq(parent.id!!), eq(BlockOwnership.OWNED), eq(EntityType.BLOCK)
            )
        ).thenReturn(rows)

        val grouped = svc.findOwnedBlocks(parent.id!!)
        assertTrue(grouped.containsKey("contacts"))
        assertEquals(2, grouped["contacts"]!!.size)
    }

    // ---------------------------------------------------------
    // findLinkedBlocks: filters LINKED + non-BLOCK references
    // ---------------------------------------------------------
    @Test
    fun `findLinkedBlocks returns LINKED blocks and non-block refs only`() {
        val svc = spy(serviceWithResolvers())

        val blockId = UUID.randomUUID()
        val ownedBlockRef = okuri.core.models.block.BlockReference(
            id = UUID.randomUUID(),
            entityType = EntityType.BLOCK,
            entityId = UUID.randomUUID(),
            entity = null,
            ownership = BlockOwnership.OWNED,
            blockId = blockId,
            orderIndex = 0,
            path = "\$.data/contacts[0]"
        )
        val linkedBlockRef = ownedBlockRef.copy(ownership = BlockOwnership.LINKED, path = "\$.data/related[0]")
        val clientRef = ownedBlockRef.copy(entityType = EntityType.CLIENT, path = "\$.data/account")

        doReturn(listOf(ownedBlockRef, linkedBlockRef, clientRef))
            .`when`(svc).loadReferences(eq(blockId), any())

        val links = svc.findLinkedBlocks(blockId)
        assertFalse(links.containsKey("contacts"))     // owned block excluded
        assertTrue(links.containsKey("related"))       // linked block included
        assertTrue(links.containsKey("account"))       // client included
    }
}
