package okuri.core.service.block

import okuri.core.configuration.auth.OrganisationSecurity
import okuri.core.entity.block.BlockChildEntity
import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.node.BlockReferenceWarning
import okuri.core.enums.block.structure.BlockReferenceFetchPolicy
import okuri.core.enums.block.structure.BlockValidationScope
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Block
import okuri.core.models.block.Reference
import okuri.core.models.block.display.BlockTypeNesting
import okuri.core.models.block.metadata.*
import okuri.core.models.block.request.CreateBlockRequest
import okuri.core.models.block.tree.BlockTreeReference
import okuri.core.models.block.tree.ContentNode
import okuri.core.models.block.tree.EntityReference
import okuri.core.models.block.tree.ReferenceNode
import okuri.core.repository.block.BlockRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.schema.SchemaService
import okuri.core.service.schema.SchemaValidationException
import okuri.core.service.util.WithUserPersona
import okuri.core.service.util.factory.block.BlockFactory
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.util.*
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue


/**
 * Comprehensive test suite for BlockService.
 * Tests block creation, updates, tree building, and archival with the new architecture.
 */
@SpringBootTest(
    classes = [
        OrganisationSecurity::class,
        BlockServiceTest.TestConfig::class,
        BlockService::class
    ]
)
class BlockServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(OrganisationSecurity::class)
    class TestConfig

    @MockitoBean
    lateinit var blockRepository: BlockRepository

    @MockitoBean
    lateinit var blockTypeService: BlockTypeService

    @MockitoBean
    lateinit var blockChildrenService: BlockChildrenService

    @MockitoBean
    lateinit var blockReferenceService: BlockReferenceService

    @MockitoBean
    lateinit var schemaService: SchemaService

    @MockitoBean
    lateinit var activityService: ActivityService

    @MockitoBean
    lateinit var authTokenService: AuthTokenService

    @Autowired
    lateinit var service: BlockService

    private fun uuid(s: String) = UUID.fromString(s)


    private fun saved(entity: BlockEntity) = entity.copy(id = UUID.randomUUID())

    // =============================================================================================
    // CREATE BLOCK - CONTENT BLOCKS
    // =============================================================================================

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock with content metadata validates and persists`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId = orgId, strictness = BlockValidationScope.SOFT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)
        whenever(schemaService.validate(eq(type.schema), any(), eq(type.strictness), any()))
            .thenReturn(listOf("warning: extra field"))

        val savedCaptor = argumentCaptor<BlockEntity>()
        whenever(blockRepository.save(savedCaptor.capture())).thenAnswer { saved(savedCaptor.firstValue) }

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Primary Contact",
            payload = BlockContentMetadata(
                data = mapOf("name" to "Jane", "email" to "jane@acme.com"),
                meta = BlockMeta()
            )
        )

        val created = service.createBlock(req)

        assertEquals("Primary Contact", created.name)
        assertNotNull(created.id)
        assertNotNull(created.validationErrors)
        assertEquals(1, created.validationErrors!!.size)
        assertEquals("warning: extra field", created.validationErrors!![0])

        // Verify schema validation was called
        verify(schemaService).validate(eq(type.schema), any(), eq(type.strictness), any())

        // Verify no reference upsert for content blocks
        verify(blockReferenceService, never()).upsertLinksFor(any(), any())
        verify(blockReferenceService, never()).upsertBlockLinkFor(any(), any())

        // Verify activity logged
        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.CREATE),
            eq(userId), eq(orgId), any(), any()
        )
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock STRICT mode throws on validation errors`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

        val type = BlockFactory.createType(orgId = orgId, strictness = BlockValidationScope.STRICT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)
        whenever(schemaService.validate(eq(type.schema), any(), eq(type.strictness), any()))
            .thenReturn(listOf("error: invalid email"))

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Bad Contact",
            payload = BlockContentMetadata(
                data = mapOf("email" to "bad-email"),
                meta = BlockMeta()
            )
        )

        assertThrows<SchemaValidationException> {
            service.createBlock(req)
        }

        // Verify block was not persisted
        verify(blockRepository, never()).save(any())
        verify(activityService, never()).logActivity(any(), any(), any(), any(), any(), any())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock with child attaches to parent via BlockChildrenService`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
        val parentId = UUID.randomUUID()

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId = orgId)
        val parentEntity = BlockEntity(
            id = parentId,
            organisationId = orgId,
            type = type,
            name = "Parent",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
            archived = false
        )

        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)
        whenever(schemaService.validate(any(), any(), any(), any())).thenReturn(emptyList())
        whenever(blockRepository.findById(parentId)).thenReturn(Optional.of(parentEntity))

        val savedCaptor = argumentCaptor<BlockEntity>()
        whenever(blockRepository.save(savedCaptor.capture())).thenAnswer { saved(savedCaptor.firstValue) }

        val nesting = BlockTypeNesting(max = null, allowedTypes = listOf("contact_card"))

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Child Block",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
            parentId = parentId,
            orderIndex = 0,
            parentNesting = nesting
        )

        service.createBlock(req)

        // Verify BlockChildrenService.addChild was called
        verify(blockChildrenService).addChild(
            child = any(),
            parentId = eq(parentId),
            index = eq(0),
            nesting = eq(nesting)
        )
    }

    // =============================================================================================
    // CREATE BLOCK - REFERENCE BLOCKS
    // =============================================================================================

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock with EntityReferenceMetadata upserts references`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
        val clientId = UUID.randomUUID()

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId = orgId)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)

        val savedCaptor = argumentCaptor<BlockEntity>()
        whenever(blockRepository.save(savedCaptor.capture())).thenAnswer { saved(savedCaptor.firstValue) }

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Client List",
            payload = EntityReferenceMetadata(
                items = listOf(
                    ReferenceItem(type = EntityType.CLIENT, id = clientId)
                ),
                presentation = Presentation.SUMMARY,
                meta = BlockMeta()
            )
        )

        service.createBlock(req)

        // Verify reference upsert was called
        verify(blockReferenceService).upsertLinksFor(any(), any())

        // Verify no schema validation for references
        verify(schemaService, never()).validate(any(), any(), any(), any())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock with BlockReferenceMetadata upserts block link`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
        val referencedBlockId = UUID.randomUUID()

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId = orgId)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)

        val savedCaptor = argumentCaptor<BlockEntity>()
        whenever(blockRepository.save(savedCaptor.capture())).thenAnswer { saved(savedCaptor.firstValue) }

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Block Link",
            payload = BlockReferenceMetadata(
                item = ReferenceItem(type = EntityType.BLOCK_TREE, id = referencedBlockId),
                expandDepth = 1,
                meta = BlockMeta()
            )
        )

        service.createBlock(req)

        // Verify block link upsert was called
        verify(blockReferenceService).upsertBlockLinkFor(any(), any())
    }

    // =============================================================================================
    // UPDATE BLOCK
    // =============================================================================================

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `updateBlock deep merges content data and validates`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId = orgId)

        val existing = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Original",
            payload = BlockContentMetadata(
                data = mapOf("a" to 1, "nested" to mapOf("x" to 1, "y" to 2)),
                meta = BlockMeta()
            ),
            archived = false
        )

        whenever(blockRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))
        whenever(schemaService.validate(any(), any(), any(), any())).thenReturn(emptyList())
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] as BlockEntity }

        val updateModel = Block(
            id = existing.id!!,
            name = "Updated",
            organisationId = orgId,
            type = type.toModel(),
            payload = BlockContentMetadata(
                data = mapOf("nested" to mapOf("x" to 99, "z" to 3), "b" to 2),
                meta = BlockMeta()
            ),
            archived = false
        )

        val updated = service.updateBlock(updateModel)

        // Verify deep merge: a=1 (preserved), nested.x=99 (updated), nested.y=2 (preserved), nested.z=3 (added), b=2 (added)
        val mergedData = (updated.payload as BlockContentMetadata).data
        assertEquals(1, mergedData["a"])
        assertEquals(2, mergedData["b"])
        val nested = mergedData["nested"] as Map<*, *>
        assertEquals(99, nested["x"])
        assertEquals(2, nested["y"])
        assertEquals(3, nested["z"])

        verify(schemaService).validate(any(), any(), any(), any())
        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.UPDATE),
            eq(userId), eq(orgId), any(), any()
        )
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `updateBlock throws when switching payload kind`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

        val type = BlockFactory.createType(orgId = orgId)

        val existing = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Original",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
            archived = false
        )

        whenever(blockRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))

        // Try to switch from content to reference
        val updateModel = Block(
            id = existing.id!!,
            name = "Updated",
            organisationId = orgId,
            type = type.toModel(),
            payload = EntityReferenceMetadata(
                items = listOf(ReferenceItem(EntityType.CLIENT, UUID.randomUUID())),
                meta = BlockMeta()
            ),
            archived = false
        )

        val exception = assertThrows<IllegalArgumentException> {
            service.updateBlock(updateModel)
        }

        assertTrue(exception.message!!.contains("Cannot switch payload kind"))
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `updateBlock with reference metadata upserts links`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId = orgId)
        val clientId1 = UUID.randomUUID()
        val clientId2 = UUID.randomUUID()

        val existing = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Clients",
            payload = EntityReferenceMetadata(
                items = listOf(ReferenceItem(EntityType.CLIENT, clientId1)),
                meta = BlockMeta()
            ),
            archived = false
        )

        whenever(blockRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] as BlockEntity }

        // Update to include new client
        val updateModel = Block(
            id = existing.id!!,
            name = "Clients",
            organisationId = orgId,
            type = type.toModel(),
            payload = EntityReferenceMetadata(
                items = listOf(
                    ReferenceItem(EntityType.CLIENT, clientId1),
                    ReferenceItem(EntityType.CLIENT, clientId2)
                ),
                meta = BlockMeta()
            ),
            archived = false
        )

        service.updateBlock(updateModel)

        // Verify references were upserted
        verify(blockReferenceService).upsertLinksFor(any(), any())

        // Verify no schema validation
        verify(schemaService, never()).validate(any(), any(), any(), any())
    }

    // =============================================================================================
    // GET BLOCK - TREE BUILDING
    // =============================================================================================

    @Test
    fun `getBlock builds content node with children`() {
        val orgId = UUID.randomUUID()
        val type = BlockFactory.createType(orgId)

        val rootId = UUID.randomUUID()
        val child1Id = UUID.randomUUID()
        val child2Id = UUID.randomUUID()

        val root = BlockEntity(
            id = rootId,
            organisationId = orgId,
            type = type,
            name = "Root",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
            archived = false
        )

        val child1 = root.copy(id = child1Id, name = "Child1")
        val child2 = root.copy(id = child2Id, name = "Child2")

        whenever(blockRepository.findById(rootId)).thenReturn(Optional.of(root))
        whenever(blockRepository.findAllById(setOf(child1Id, child2Id))).thenReturn(listOf(child1, child2))

        val edges = listOf(
            BlockChildEntity(UUID.randomUUID(), rootId, child1Id, 0),
            BlockChildEntity(UUID.randomUUID(), rootId, child2Id, 1)
        )

        whenever(blockChildrenService.listChildren(rootId)).thenReturn(edges)

        val tree = service.getBlock(rootId)

        assertNotNull(tree)
        assertTrue(tree.root is ContentNode)
        val contentNode = tree.root as ContentNode
        assertEquals("Root", contentNode.block.name)
        assertNotNull(contentNode.children)
        assertEquals(2, contentNode.children!!.size)
    }

    @Test
    fun `getBlock detects cycles and returns warning`() {
        val orgId = UUID.randomUUID()
        val type = BlockFactory.createType(orgId)

        val blockId = UUID.randomUUID()

        // Block that references itself (cycle)
        val block = BlockEntity(
            id = blockId,
            organisationId = orgId,
            type = type,
            name = "Cyclic",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
            archived = false
        )

        whenever(blockRepository.findById(blockId)).thenReturn(Optional.of(block))
        whenever(blockRepository.findAllById(setOf(blockId))).thenReturn(listOf(block))

        // Simulate cycle: block has itself as a child
        val edges = listOf(
            BlockChildEntity(UUID.randomUUID(), blockId, blockId, 0)
        )

        whenever(blockChildrenService.listChildren(blockId)).thenReturn(edges)

        val tree = service.getBlock(blockId)

        // Should detect cycle

        assertNotNull(tree).run {
            assertIs<ContentNode>(this.root).run {
                assertNotNull(this.children).run {
                    assertTrue(this.isNotEmpty())
                    val selfChild = this[0] as ContentNode
                    assertTrue(selfChild.warnings.isNotEmpty())
                    assertTrue(selfChild.warnings.any { it.contains("Cycle detected") })
                }
            }
        }
    }

    // =============================================================================================
    // ARCHIVE BLOCK
    // =============================================================================================

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `archiveBlock sets archived status and logs activity`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId)
        val entity = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Test",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
            archived = false
        )

        whenever(blockRepository.findById(entity.id!!)).thenReturn(Optional.of(entity))
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] as BlockEntity }

        service.archiveBlock(entity.toModel(), true)

        verify(blockRepository).save(argThat<BlockEntity> {
            this.id == entity.id && this.archived == true
        })

        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.ARCHIVE),
            eq(userId), eq(orgId), eq(entity.id), any()
        )
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `archiveBlock no-ops when status unchanged`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

        val type = BlockFactory.createType(orgId)
        val entity = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Test",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
            archived = true // Already archived
        )

        whenever(blockRepository.findById(entity.id!!)).thenReturn(Optional.of(entity))

        service.archiveBlock(entity.toModel(), true)

        // Should not save or log activity
        verify(blockRepository, never()).save(any())
        verify(activityService, never()).logActivity(any(), any(), any(), any(), any(), any())
    }

    // =============================================================================================
    // ADDITIONAL COVERAGE - EDGE CASES AND MISSING SCENARIOS
    // =============================================================================================

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock throws when using archived BlockType`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

        val type = BlockFactory.createType(orgId = orgId, archived = true)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Test Block",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta())
        )

        val exception = assertThrows<IllegalArgumentException> {
            service.createBlock(req)
        }

        assertTrue(exception.message!!.contains("archived"))
        verify(blockRepository, never()).save(any())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock with typeKey fallback resolves type`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val type = BlockFactory.createType(orgId = orgId, key = "contact_card", version = 2)
        whenever(blockTypeService.getByKey("contact_card", orgId, 2)).thenReturn(type)
        whenever(schemaService.validate(any(), any(), any(), any())).thenReturn(emptyList())

        val savedCaptor = argumentCaptor<BlockEntity>()
        whenever(blockRepository.save(savedCaptor.capture())).thenAnswer { saved(savedCaptor.firstValue) }

        val req = CreateBlockRequest(
            typeId = null, // Use typeKey instead
            typeKey = "contact_card",
            organisationId = orgId,
            typeVersion = 2,
            name = "Fallback Test",
            payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta())
        )

        val created = service.createBlock(req)

        assertEquals("Fallback Test", created.name)
        assertEquals(type.id, created.type.id)
        verify(blockTypeService).getByKey("contact_card", orgId, 2)
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `updateBlock STRICT mode throws on validation errors`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

        val type = BlockFactory.createType(orgId = orgId, strictness = BlockValidationScope.STRICT)
        val existingEntity = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Original",
            payload = BlockContentMetadata(
                data = mapOf("email" to "valid@email.com"),
                meta = BlockMeta()
            ),
            archived = false
        )

        whenever(blockRepository.findById(existingEntity.id!!)).thenReturn(Optional.of(existingEntity))
        whenever(schemaService.validate(eq(type.schema), any(), eq(type.strictness), any()))
            .thenReturn(listOf("error: invalid format"))

        val updateModel = Block(
            id = existingEntity.id!!,
            organisationId = orgId,
            type = type.toModel(),
            name = "Updated",
            payload = BlockContentMetadata(
                data = mapOf("email" to "invalid-email"),
                meta = BlockMeta()
            ),
            validationErrors = null,
            archived = false
        )

        assertThrows<SchemaValidationException> {
            service.updateBlock(updateModel)
        }

        verify(blockRepository, never()).save(any())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `updateBlock with EntityReferenceMetadata upserts references delta`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val userId = uuid("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

        whenever(authTokenService.getUserId()).thenReturn(userId)

        val client1Id = UUID.randomUUID()
        val client2Id = UUID.randomUUID()

        val type = BlockFactory.createType(orgId)
        val existingEntity = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Reference Block",
            payload = EntityReferenceMetadata(
                items = listOf(ReferenceItem(type = EntityType.CLIENT, id = client1Id)),
                path = "$.clients",
                meta = BlockMeta()
            ),
            archived = false
        )

        whenever(blockRepository.findById(existingEntity.id!!)).thenReturn(Optional.of(existingEntity))
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] }

        val updateModel = Block(
            id = existingEntity.id!!,
            organisationId = orgId,
            type = type.toModel(),
            name = "Updated Reference Block",
            payload = EntityReferenceMetadata(
                items = listOf(
                    ReferenceItem(type = EntityType.CLIENT, id = client2Id) // Changed to client2
                ),
                path = "$.clients",
                meta = BlockMeta()
            ),
            validationErrors = null,
            archived = false
        )

        service.updateBlock(updateModel)

        // Verify references were upserted with new list
        verify(blockReferenceService).upsertLinksFor(any(), any())
        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.UPDATE),
            eq(userId), eq(orgId), any(), any()
        )
    }

    @Test
    fun `getBlock returns ReferenceNode for EntityReferenceMetadata`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val clientId = UUID.randomUUID()

        val type = BlockFactory.createType(orgId)
        val entity = BlockEntity(
            id = blockId,
            organisationId = orgId,
            type = type,
            name = "Reference List Block",
            payload = EntityReferenceMetadata(
                items = listOf(ReferenceItem(type = EntityType.CLIENT, id = clientId)),
                path = "$.clients",
                fetchPolicy = BlockReferenceFetchPolicy.LAZY,
                meta = BlockMeta()
            ),
            archived = false
        )

        whenever(blockRepository.findById(blockId)).thenReturn(Optional.of(entity))

        val references = listOf(
            Reference(
                id = UUID.randomUUID(),
                entityType = EntityType.CLIENT,
                entityId = clientId,
                entity = null,
                orderIndex = 0,
                warning = BlockReferenceWarning.REQUIRES_LOADING
            )
        )
        whenever(blockReferenceService.findListReferences(blockId, entity.payload as EntityReferenceMetadata))
            .thenReturn(references)

        val tree = service.getBlock(blockId)

        assertNotNull(tree)
        assertTrue(tree.root is ReferenceNode)
        val refNode = tree.root as ReferenceNode
        assertTrue(refNode.reference is EntityReference)
        val entityRef = refNode.reference as EntityReference
        assertEquals(1, entityRef.reference.size)
        assertEquals(BlockReferenceWarning.REQUIRES_LOADING, entityRef.reference[0].warning)
    }

    @Test
    fun `getBlock returns ReferenceNode for BlockReferenceMetadata`() {
        val orgId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val referencedBlockId = UUID.randomUUID()

        val type = BlockFactory.createType(orgId)
        val entity = BlockEntity(
            id = blockId,
            organisationId = orgId,
            type = type,
            name = "Block Link",
            payload = BlockReferenceMetadata(
                item = ReferenceItem(type = EntityType.BLOCK_TREE, id = referencedBlockId),
                path = "$.block",
                fetchPolicy = BlockReferenceFetchPolicy.LAZY,
                meta = BlockMeta()
            ),
            archived = false
        )

        whenever(blockRepository.findById(blockId)).thenReturn(Optional.of(entity))

        val blockRef = Reference(
            id = UUID.randomUUID(),
            entityType = EntityType.BLOCK_TREE,
            entityId = referencedBlockId,
            entity = null,
            warning = BlockReferenceWarning.REQUIRES_LOADING
        )
        val edge = BlockReferenceEntity(
            id = UUID.randomUUID(),
            parentId = blockId,
            entityType = EntityType.BLOCK_TREE,
            entityId = referencedBlockId,
            path = "$.block",
            orderIndex = null
        )

        whenever(blockReferenceService.findBlockLink(blockId, entity.payload as BlockReferenceMetadata))
            .thenReturn(blockRef to edge)

        val tree = service.getBlock(blockId)
        assertNotNull(tree).run {
            this.root.run {
                assertIs<ReferenceNode>(this).run {
                    assertIs<BlockTreeReference>(this.reference).run {
                        assertEquals(BlockReferenceWarning.REQUIRES_LOADING, this.reference.warning)
                    }

                }
            }
        }
    }
}
