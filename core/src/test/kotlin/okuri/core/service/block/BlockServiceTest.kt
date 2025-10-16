package okuri.core.service.block

import io.github.oshai.kotlinlogging.KLogger
import okuri.core.configuration.auth.OrganisationSecurity
import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockValidationScope
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Block
import okuri.core.models.block.request.BlockTree
import okuri.core.models.block.request.CreateBlockRequest
import okuri.core.models.block.structure.BlockMetadata
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.schema.SchemaService
import okuri.core.service.schema.SchemaValidationException
import okuri.core.service.util.WithUserPersona
import okuri.core.service.util.factory.block.BlockFactory
import org.junit.jupiter.api.Assertions.*
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

/**
 * Spring test to ensure @PreAuthorize is enforced via proxies.
 * Dependencies are mocked with @MockBean.
 */
@SpringBootTest(classes = [OrganisationSecurity::class, AuthTokenService::class, BlockServiceTest.TestConfig::class, BlockService::class])
class BlockServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(OrganisationSecurity::class)
    class TestConfig

    @MockitoBean
    private lateinit var blockRepository: BlockRepository

    @MockitoBean
    private lateinit var blockTypeService: BlockTypeService

    @MockitoBean
    private lateinit var blockReferenceService: BlockReferenceService

    @MockitoBean
    private lateinit var blockReferenceRepository: BlockReferenceRepository

    @MockitoBean
    private lateinit var schemaService: SchemaService

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    lateinit var service: BlockService

    // -----------------------------
    // createBlock: SOFT validation
    // -----------------------------
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
    fun `createBlock succeeds with SOFT validation and logs activity`() {
        // Scenario: create with SOFT strictness, schema returns warnings only.
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId = orgId, scope = BlockValidationScope.SOFT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)
        whenever(
            schemaService.validate(
                eq(type.schema),
                any(),
                eq(type.strictness),
                any()

            )
        ).thenReturn(listOf("warn: extra field"))

        // save should assign an ID and return entity
        argumentCaptor<BlockEntity>().apply {
            whenever(blockRepository.save(capture())).thenAnswer { inv ->
                val e = firstValue
                e.copy(id = UUID.randomUUID())
            }
        }


        val payload = mapOf(
            "data" to mapOf("name" to "Jane", "email" to "jane@acme.com")
        )
        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            typeVersion = null,
            name = "Primary Contact",
            payload = payload
        )

        val created = service.createBlock(req)

        // Expected: created with validationErrors present (SOFT), refs upsert invoked, activity logged
        assertEquals("Primary Contact", created.name)
        assertNotNull(created.id)
        assertNotNull(created.validationErrors)
        verify(blockReferenceService).upsertReferencesFor(any(), eq(payload["data"] as Map<String, Any?>))
        verify(activityService).logActivity(
            any(),              // Activity.BLOCK (if you fixed it)
            eq(okuri.core.enums.util.OperationType.CREATE),
            any(), eq(orgId), any(), any()
        )
    }

    // ------------------------------------
    // createBlock: STRICT + invalid data
    // ------------------------------------
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
    fun `createBlock throws on STRICT validation failure, no save, no refs`() {
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId = orgId, scope = BlockValidationScope.STRICT)
        whenever(blockTypeService.getById(type.id!!)).thenReturn(type)
        whenever(
            schemaService.validate(
                eq(type.schema),
                any(),
                eq(type.strictness),
                any()
            )
        ).thenReturn(listOf("error: email invalid"))

        val req = CreateBlockRequest(
            typeId = type.id,
            typeKey = null,
            organisationId = orgId,
            name = "Bad",
            payload = mapOf("data" to mapOf("email" to "bad-email"))
        )

        assertThrows<SchemaValidationException> { service.createBlock(req) }
        verify(blockRepository, never()).save(any())
        verify(blockReferenceService, never()).upsertReferencesFor(any(), any())
    }

    // ----------------------------------------
    // updateBlock: partial merge + ref rebuild
    // ----------------------------------------
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
    fun `updateBlock merges data and rebuilds references`() {
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId = orgId, scope = BlockValidationScope.SOFT)
        val existing = BlockFactory.generateBlock(
            orgId = orgId,
            type = type,
            data = mapOf("a" to 1, "nested" to mapOf("x" to 1))
        )
        whenever(blockRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))
        whenever(schemaService.validate(eq(type.schema), any(), eq(type.strictness), any())).thenReturn(emptyList())

        // save returns updated entity
        whenever(blockRepository.save(any())).thenAnswer { it.arguments[0] as BlockEntity }

        val updateModel = Block(
            id = existing.id!!,
            name = "Updated",
            organisationId = orgId,
            type = type.toModel(),
            payload = BlockMetadata(
                data = mapOf("nested" to mapOf("x" to 2, "y" to 9)), refs = emptyList(),
                meta = okuri.core.models.block.structure.BlockMeta()
            ),
            archived = false
        )

        val updated = service.updateBlock(updateModel)

        // Expected deep merge
        val merged = updated.payload.data
        assertEquals(1, merged["a"])
        assertEquals(mapOf("x" to 2, "y" to 9), merged["nested"])
        assertEquals("Updated", updated.name)

        verify(blockReferenceService).upsertReferencesFor(any(), eq(merged))
        verify(activityService).logActivity(
            any(), eq(okuri.core.enums.util.OperationType.UPDATE), any(), eq(orgId), any(), any()
        )
    }

    // ----------------------------------------------
    // getBlock: builds child tree and linked refs
    // ----------------------------------------------
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
    fun `getBlock returns children by slot and linked references`() {
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId)
        val root = BlockFactory.generateBlock(orgId = orgId, type = type, name = "Root")
        whenever(blockRepository.findById(root.id!!)).thenReturn(Optional.of(root))

        // owned-block edges for "contacts" -> two children
        val child1 = BlockFactory.generateBlock(orgId = orgId, type = type, name = "C1")
        val child2 = BlockFactory.generateBlock(orgId = orgId, type = type, name = "C2")
        val e1 = BlockReferenceEntity(
            id = UUID.randomUUID(),
            block = root,
            entityType = EntityType.BLOCK,
            entityId = child1.id!!,
            ownership = okuri.core.enums.block.BlockOwnership.OWNED,
            path = "\$.data/contacts[0]",
            orderIndex = 0
        )
        val e2 = BlockReferenceEntity(
            id = UUID.randomUUID(),
            block = root,
            entityType = EntityType.BLOCK,
            entityId = child2.id!!,
            ownership = okuri.core.enums.block.BlockOwnership.OWNED,
            path = "\$.data/contacts[1]",
            orderIndex = 1
        )

        whenever(blockReferenceService.findOwnedBlocks(root.id!!)).thenReturn(mapOf("contacts" to listOf(e1, e2)))
        whenever(blockRepository.findAllById(hashSetOf(child1.id!!, child2.id!!))).thenReturn(listOf(child1, child2))


        // linked refs (e.g., a CLIENT at "account")
        val linked = mapOf(
            "account" to emptyList<okuri.core.models.block.BlockReference<*>>() // keep simple; just assert map presence
        )
        whenever(blockReferenceService.findLinkedBlocks(root.id!!)).thenReturn(linked)

        val tree: BlockTree = service.getBlock(root.id!!, expandRefs = true, maxDepth = 2)

        assertEquals("Root", tree.root.block.name)
        assertTrue(tree.root.children.containsKey("contacts"))
        assertEquals(2, tree.root.children["contacts"]!!.size)
        assertEquals(linked, tree.root.references)
    }

    // ------------------------------------------
    // archiveBlock toggles and logs appropriately
    // ------------------------------------------
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
    fun `archiveBlock archives when not already archived`() {
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId)
        val entity = BlockFactory.generateBlock(orgId = orgId, type = type).copy(archived = false)
        whenever(blockRepository.findById(entity.id!!)).thenReturn(Optional.of(entity))
        whenever(blockRepository.save(any())).thenAnswer { (it.arguments[0] as BlockEntity) }

        val ok = service.archiveBlock(entity.toModel(), true)
        assertTrue(ok)
        verify(activityService).logActivity(
            any(), eq(okuri.core.enums.util.OperationType.ARCHIVE), any(), eq(orgId), any(), any()
        )
    }

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
    fun `archiveBlock no-ops if already in requested state`() {
        val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        val type = BlockFactory.generateBlockType(orgId)
        val entity = BlockFactory.generateBlock(orgId = orgId, type = type).copy(archived = true)
        whenever(blockRepository.findById(entity.id!!)).thenReturn(Optional.of(entity))

        val ok = service.archiveBlock(entity.toModel(), true)
        assertFalse(ok) // your function returns false early
        verify(blockRepository, never()).save(any())
    }
}
