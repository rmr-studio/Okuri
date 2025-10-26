package okuri.core.service.block

import io.github.oshai.kotlinlogging.KLogger
import okuri.core.configuration.auth.OrganisationSecurity
import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.BlockValidationScope
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Block
import okuri.core.models.block.BlockTree
import okuri.core.models.block.request.CreateBlockRequest
import okuri.core.models.block.structure.BlockMeta
import okuri.core.models.block.structure.BlockSchema
import okuri.core.models.common.grid.LayoutGrid
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.schema.SchemaService
import okuri.core.service.schema.SchemaValidationException
import okuri.core.service.util.WithUserPersona
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertNotNull
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.util.*

/**
 * Tests updated BlockService behaviour for polymorphic payloads:
 *  - "content" (BlockContentMetadata): validate + no link upsert
 *  - "references" (ReferenceListMetadata): link upsert + no content validation
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
    lateinit var blockReferenceService: BlockReferenceService

    @MockitoBean
    lateinit var blockReferenceRepository: BlockReferenceRepository

    @MockitoBean
    lateinit var schemaService: SchemaService

    @MockitoBean
    lateinit var activityService: ActivityService

    @MockitoBean
    lateinit var logger: KLogger

    @MockitoBean
    lateinit var authTokenService: AuthTokenService

    @Autowired
    lateinit var service: BlockService

    // ---- helpers ---------------------------------------------------------------------------

    private fun uuid(s: String) = UUID.fromString(s)

    private fun aType(
        orgId: UUID,
        key: String = "contact",
        version: Int = 1,
        strictness: BlockValidationScope = BlockValidationScope.SOFT,
        archived: Boolean = false
    ): BlockTypeEntity =
        BlockTypeEntity(
            id = UUID.randomUUID(),
            key = key,
            displayName = "Contact",
            description = "Contact type",
            organisationId = orgId,
            system = false,
            version = version,
            strictness = strictness,
            schema = BlockSchema(name = "Contact"), // minimal
            archived = archived,
            displayStructure = okuri.core.models.block.structure.BlockDisplay(
                form = okuri.core.models.block.structure.BlockFormStructure(emptyMap()),
                render = okuri.core.models.block.structure.BlockRenderStructure(
                    version = 1,
                    layoutGrid = LayoutGrid(items = emptyList()),
                    components = emptyMap()
                )
            )
        )

    private fun saved(entity: BlockEntity) = entity.copy(id = UUID.randomUUID())

    // -----------------------------------------------------------------------------------------
    // createBlock: CONTENT (SOFT) -> validate; no link upsert; activity logged
    // -----------------------------------------------------------------------------------------
    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock(content) validates schema and logs activity`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        whenever(authTokenService.getUserId()).thenReturn(uuid("00000000-0000-0000-0000-000000000001"))

        val type = aType(orgId = orgId, strictness = BlockValidationScope.SOFT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)
        whenever(schemaService.validate(eq(type.schema), any(), eq(type.strictness)))
            .thenReturn(listOf("warn: extra field"))

        // capture saved entity
        val savedCaptor = argumentCaptor<BlockEntity>()
        whenever(blockRepository.save(savedCaptor.capture())).thenAnswer { saved(savedCaptor.firstValue) }

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Primary Contact",
            payload = mapOf(
                "kind" to "content",
                "data" to mapOf("name" to "Jane", "email" to "jane@acme.com")
            )
        )

        val created = service.createBlock(req)

        assertEquals("Primary Contact", created.name)
        assertNotNull(created.id)
        assertNotNull(created.validationErrors) // SOFT -> warnings bubble up

        // No link upsert for content payload
        verify(blockReferenceService, never()).upsertLinksFor(any(), any(), any())

        // Activity logged
        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.CREATE),
            any(), eq(orgId), any(), any()
        )
    }

    // -----------------------------------------------------------------------------------------
    // createBlock: CONTENT (STRICT + invalid) -> throws; no save; no links
    // -----------------------------------------------------------------------------------------
    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock(content) STRICT invalid throws and does not persist`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = aType(orgId = orgId, strictness = BlockValidationScope.STRICT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)
        whenever(schemaService.validate(eq(type.schema), any(), eq(type.strictness)))
            .thenReturn(listOf("error: bad email"))

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Bad",
            payload = mapOf("kind" to "content", "data" to mapOf("email" to "bad"))
        )

        assertThrows<SchemaValidationException> {
            service.createBlock(req)
        }

        verify(blockRepository, never()).save(any())
        verify(blockReferenceService, never()).upsertLinksFor(any(), any(), any())
    }

    // -----------------------------------------------------------------------------------------
    // createBlock: REFERENCES -> upsert links; no schema validation of content
    // -----------------------------------------------------------------------------------------
    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `createBlock(references) upserts links and logs activity`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        whenever(authTokenService.getUserId()).thenReturn(uuid("00000000-0000-0000-0000-000000000001"))

        val type = aType(orgId = orgId, strictness = BlockValidationScope.SOFT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)

        // save returns entity with ID
        val savedCaptor = argumentCaptor<BlockEntity>()
        whenever(blockRepository.save(savedCaptor.capture())).thenAnswer { saved(savedCaptor.firstValue) }

        val clientId = UUID.randomUUID()
        val blockId = UUID.randomUUID()
        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Ref List",
            payload = mapOf(
                "kind" to "references",
                "items" to listOf(
                    mapOf("type" to "CLIENT", "id" to clientId.toString()),
                    mapOf("type" to "BLOCK", "id" to blockId.toString())
                ),
                "presentation" to "SUMMARY"
            )
        )

        val created = service.createBlock(req)
        assertEquals("Ref List", created.name)
        assertNotNull(created.id)

        // No schema validate for "references"
        verify(schemaService, never()).validate(any(), any(), any())

        // Links are upserted once with the items
        verify(blockReferenceService).upsertLinksFor(
            any(), // saved entity
            argThat { size == 2 }, // items
            eq("\$.items")
        )

        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.CREATE),
            any(), eq(orgId), any(), any()
        )
    }

    // -----------------------------------------------------------------------------------------
    // updateBlock: CONTENT -> deep merge + validate; no link upsert
    // -----------------------------------------------------------------------------------------
    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `updateBlock(content) merges and validates, no link upsert`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        whenever(authTokenService.getUserId()).thenReturn(uuid("00000000-0000-0000-0000-000000000001"))

        val type = aType(orgId = orgId, strictness = BlockValidationScope.SOFT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)

        // Existing entity with content payload
        val existing = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Root",
            payload = okuri.core.models.block.structure.BlockContentMetadata(
                data = mapOf("a" to 1, "nested" to mapOf("x" to 1)),
                meta = BlockMeta()
            ),
            parent = null,
            archived = false
        )
        whenever(blockRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))
        whenever(schemaService.validate(eq(type.schema), any(), eq(type.strictness))).thenReturn(emptyList())
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] as BlockEntity }

        val updateModel = Block(
            id = existing.id!!,
            name = "Updated",
            organisationId = orgId,
            type = type.toModel(),
            payload = okuri.core.models.block.structure.BlockContentMetadata(
                data = mapOf("nested" to mapOf("x" to 2, "y" to 9)),
                meta = BlockMeta()
            ),
            archived = false
        )

        val updated = service.updateBlock(updateModel)

        // Deep merge assertion
        val merged = (updated.payload as okuri.core.models.block.structure.BlockContentMetadata).data
        assertEquals(1, merged["a"])
        assertEquals(mapOf("x" to 2, "y" to 9), merged["nested"])
        assertEquals("Updated", updated.name)

        verify(schemaService).validate(eq(type.schema), any(), eq(type.strictness))
        verify(blockReferenceService, never()).upsertLinksFor(any(), any(), any())
        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.UPDATE),
            any(), eq(orgId), any(), any()
        )
    }

    // -----------------------------------------------------------------------------------------
    // updateBlock: REFERENCES -> replaces list; link upsert; no schema validation
    // -----------------------------------------------------------------------------------------
    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `updateBlock(references) upserts links and does not validate content`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        whenever(authTokenService.getUserId()).thenReturn(uuid("00000000-0000-0000-0000-000000000001"))

        val type = aType(orgId = orgId, strictness = BlockValidationScope.SOFT)

        // Existing REF block with one item
        val existing = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Refs",
            payload = okuri.core.models.block.structure.ReferenceListMetadata(
                items = listOf(
                    okuri.core.models.block.structure.ReferenceItem(
                        type = EntityType.CLIENT, id = UUID.randomUUID()
                    )
                ),
                presentation = okuri.core.models.block.structure.Presentation.SUMMARY,
                meta = BlockMeta()
            ),
            parent = null,
            archived = false
        )
        whenever(blockRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] as BlockEntity }

        // Updated block with two items
        val newItem1 = okuri.core.models.block.structure.ReferenceItem(EntityType.CLIENT, UUID.randomUUID())
        val newItem2 = okuri.core.models.block.structure.ReferenceItem(EntityType.BLOCK, UUID.randomUUID())
        val updateModel = Block(
            id = existing.id!!,
            name = "Refs",
            organisationId = orgId,
            type = type.toModel(),
            payload = okuri.core.models.block.structure.ReferenceListMetadata(
                items = listOf(newItem1, newItem2),
                presentation = okuri.core.models.block.structure.Presentation.SUMMARY,
                meta = BlockMeta()
            ),
            archived = false
        )

        val updated = service.updateBlock(updateModel)
        assertEquals("Refs", updated.name)

        // No schema validation for references
        verify(schemaService, never()).validate(any(), any(), any())

        // Links upserted with the new 2 items
        verify(blockReferenceService).upsertLinksFor(any(), argThat { size == 2 }, eq("\$.items"))

        verify(activityService).logActivity(
            eq(okuri.core.enums.activity.Activity.BLOCK),
            eq(okuri.core.enums.util.OperationType.UPDATE),
            any(), eq(orgId), any(), any()
        )
    }

    // -----------------------------------------------------------------------------------------
    // getBlock: verify child expansion (owned) – keep minimal
    // -----------------------------------------------------------------------------------------
    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        roles = [
            okuri.core.service.util.OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
            )
        ]
    )
    fun `getBlock builds owned-children tree`() {
        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = aType(orgId)

        val root = BlockEntity(
            id = UUID.randomUUID(),
            organisationId = orgId,
            type = type,
            name = "Root",
            payload = okuri.core.models.block.structure.BlockContentMetadata(
                data = mapOf("contacts" to emptyList<Any>()),
                meta = BlockMeta()
            ),
            parent = null,
            archived = false
        )

        val child1 = root.copy(
            id = UUID.randomUUID(),
            name = "C1"
        )
        val child2 = root.copy(
            id = UUID.randomUUID(),
            name = "C2"
        )

        whenever(blockRepository.findById(root.id!!)).thenReturn(Optional.of(root))

        // Simulate findOwnedBlocks grouping by slot "contacts"
        val e1 = BlockReferenceEntity(
            id = UUID.randomUUID(),
            block = root,
            entityType = EntityType.BLOCK,
            entityId = child1.id!!,
            ownership = BlockOwnership.OWNED,
            path = "\$.data/contacts[0]",
            orderIndex = 0
        )
        val e2 = e1.copy(id = UUID.randomUUID(), entityId = child2.id!!, path = "\$.data/contacts[1]", orderIndex = 1)
        whenever(blockReferenceService.findOwnedBlocks(root.id!!)).thenReturn(mapOf("contacts" to listOf(e1, e2)))
        whenever(blockRepository.findAllById(setOf(child1.id!!, child2.id!!))).thenReturn(listOf(child1, child2))

        val tree: BlockTree = service.getBlock(root.id!!, maxDepth = 2)

        assertEquals("Root", tree.root.block.name)
        tree.root.children.run {
            assertNotNull(this)
            assertTrue(this.containsKey("contacts"))
            this["contacts"].run {
                assertNotNull(this)
                assertEquals(2, this.size)
                val names = this.map { it.block.name }
                assertTrue(names.containsAll(listOf("C1", "C2")))
            }
        }
    }

    // -----------------------------------------------------------------------------------------
    // archiveBlock toggles and logs
    // -----------------------------------------------------------------------------------------
//    @Test
//    @WithUserPersona(
//        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
//        email = "email@email.com",
//        roles = [
//            okuri.core.service.util.OrganisationRole(
//                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
//                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
//            )
//        ]
//    )
//    fun `archiveBlock archives and logs`() {
//        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
//        val type = aType(orgId)
//        val entity = BlockEntity(
//            id = UUID.randomUUID(),
//            organisationId = orgId,
//            type = type,
//            name = "X",
//            payload = okuri.core.models.block.structure.BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
//            parent = null,
//            archived = false
//        )
//
//        whenever(blockRepository.findById(entity.id!!)).thenReturn(Optional.of(entity))
//        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] as BlockEntity }
//
//        val ok = service.archiveBlock(entity.toModel(), true)
//        assertTrue(ok)
//
//        verify(activityService).logActivity(
//            eq(okuri.core.enums.activity.Activity.BLOCK),
//            eq(okuri.core.enums.util.OperationType.ARCHIVE),
//            any(), eq(orgId), any(), any()
//        )
//    }

//    @Test
//    @WithUserPersona(
//        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
//        email = "email@email.com",
//        roles = [
//            okuri.core.service.util.OrganisationRole(
//                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
//                role = okuri.core.enums.organisation.OrganisationRoles.OWNER
//            )
//        ]
//    )
//    fun `archiveBlock no-ops if already archived`() {
//        val orgId = uuid("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
//        val type = aType(orgId)
//        val entity = BlockEntity(
//            id = UUID.randomUUID(),
//            organisationId = orgId,
//            type = type,
//            name = "X",
//            payload = okuri.core.models.block.structure.BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
//            parent = null,
//            archived = true
//        )
//        whenever(blockRepository.findById(entity.id!!)).thenReturn(Optional.of(entity))
//
//        val ok = service.archiveBlock(entity.toModel(), true)
//        assertFalse(ok)
//        verify(blockRepository, never()).save(any())
//    }
}