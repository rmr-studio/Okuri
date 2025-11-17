package okuri.core.service.block

import io.github.oshai.kotlinlogging.KLogger
import okuri.core.configuration.auth.OrganisationSecurity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.structure.BlockValidationScope
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.repository.block.BlockTypeRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.util.OrganisationRole
import okuri.core.service.util.WithUserPersona
import okuri.core.service.util.factory.block.BlockFactory
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.util.*

@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "email@email.com",
    displayName = "Jared Tucker",
    roles = [
        OrganisationRole(
            organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = OrganisationRoles.ADMIN
        )
    ]
)
@SpringBootTest(classes = [AuthTokenService::class, OrganisationSecurity::class, BlockTypeServiceTest.TestConfig::class, BlockTypeService::class])
class BlockTypeServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(OrganisationSecurity::class)
    class TestConfig

    @MockitoBean
    private lateinit var blockTypeRepository: BlockTypeRepository

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var blockTypeService: BlockTypeService

    private final val orgId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

    // ------------------------------------------------------------------
    // publishBlockType: saves from request and logs activity
    // ------------------------------------------------------------------
    @Test
    fun `publishBlockType saves and returns model, logs CREATE activity`() {
        // Scenario: A user publishes a block type. Repository saves and returns entity with id.
        // Expect: returned model matches saved entity; activity logged.
        val type = BlockFactory.createType(
            orgId = orgId,
            key = "invoice_header",
            version = 1,
            strictness = BlockValidationScope.SOFT
        )

        whenever(blockTypeRepository.save(any<BlockTypeEntity>())).thenReturn(type)

        val req = CreateBlockTypeRequest(
            key = "invoice_header",
            name = "Invoice Header",
            description = "desc",
            organisationId = orgId,
            mode = BlockValidationScope.SOFT,
            schema = BlockFactory.generateSchema(),
            display = BlockFactory.generateDisplay()
        )

        val saved = blockTypeService.publishBlockType(req)
        verify(activityService).logActivity(
            activity = eq(okuri.core.enums.activity.Activity.BLOCK_TYPE),
            operation = eq(okuri.core.enums.util.OperationType.CREATE),
            userId = any(), organisationId = eq(orgId), targetId = eq(saved.id), additionalDetails = any()
        )

        // Also capture what was saved to ensure request → entity mapping is sane
        val captor = argumentCaptor<BlockTypeEntity>()
        verify(blockTypeRepository).save(captor.capture())
        val persisted = captor.firstValue
        assertEquals("invoice_header", persisted.key)
        assertEquals("Invoice Header", persisted.displayName)
        assertEquals(orgId, persisted.organisationId)
        assertEquals(BlockValidationScope.SOFT, persisted.strictness)
    }

    // ------------------------------------------------------------------
    // updateBlockType: append-only new row with version+1
    // ------------------------------------------------------------------
    @Test
    fun `updateBlockType creates a new version row and logs CREATE`() {
        // Scenario: Updating an existing type should append a new row (version+1), not mutate existing.
        // Expect: repo.save called with id=null and version=existing.version+1; activity logged as CREATE.

        val type = BlockFactory.createType(
            orgId = orgId,
            key = "invoice_header",
            version = 3,
            strictness = BlockValidationScope.SOFT
        )

        whenever(blockTypeRepository.findById(type.id!!)).thenReturn(Optional.of(type))

        // Return what we save (with generated id)
        whenever(blockTypeRepository.save(any())).thenAnswer { inv ->
            (inv.arguments[0] as BlockTypeEntity).copy(id = UUID.randomUUID())
        }

        val inputModel = type.toModel().copy(
            name = "Invoice Header v4",
            description = "new desc",
            strictness = BlockValidationScope.STRICT, // change strictness
            display = BlockFactory.generateDisplay(),
            // schema change too
            schema = BlockFactory.generateSchema().copy(description = "changed")
        )

        blockTypeService.updateBlockType(inputModel)

        val captor = argumentCaptor<BlockTypeEntity>()
        verify(blockTypeRepository).save(captor.capture())
        val saved = captor.firstValue

        assertNull(saved.id) // append-only (id assigned by DB)
        assertEquals(type.key, saved.key)
        assertEquals(type.organisationId, saved.organisationId)
        assertEquals(4, saved.version) // existing.version + 1
        assertEquals("Invoice Header v4", saved.displayName)
        assertEquals(BlockValidationScope.STRICT, saved.strictness)
        assertFalse(saved.archived)

        verify(activityService).logActivity(
            activity = eq(okuri.core.enums.activity.Activity.BLOCK_TYPE),
            operation = eq(okuri.core.enums.util.OperationType.CREATE),
            userId = any(),
            organisationId = eq(type.organisationId),
            targetId = any(),
            additionalDetails = Mockito.contains("forked to v4 from")
        )
    }

    // ------------------------------------------------------------------
    // archiveBlockType: archive (DELETE op) and restore (UPDATE op)
    // ------------------------------------------------------------------
    @Test
    fun `archiveBlockType sets archived true and logs ARCHIVED`() {
        // Scenario: Archiving a type sets archived=true and logs DELETE

        val type = BlockFactory.createType(
            orgId = orgId,
            key = "invoice_header",
            version = 3,
            strictness = BlockValidationScope.SOFT
        )

        whenever(blockTypeRepository.findById(type.id!!)).thenReturn(Optional.of(type))
        whenever(blockTypeRepository.save(any())).thenAnswer { it.arguments[0] }

        blockTypeService.archiveBlockType(type.id!!, true)

        val captor = argumentCaptor<BlockTypeEntity>()
        verify(blockTypeRepository).save(captor.capture())
        assertTrue(captor.firstValue.archived)

        verify(activityService).logActivity(
            activity = eq(okuri.core.enums.activity.Activity.BLOCK_TYPE),
            operation = eq(okuri.core.enums.util.OperationType.ARCHIVE),
            userId = any(),
            organisationId = eq(type.organisationId),
            targetId = eq(type.id),
            additionalDetails = Mockito.contains("archive=true")
        )
    }

    @Test
    fun `archiveBlockType sets archived false and logs RESTORE`() {
        // Scenario: Restoring a type sets archived=false and logs UPDATE
        val existing = BlockFactory.createType(
            orgId = orgId,
            key = "invoice_header",
            version = 3,
            strictness = BlockValidationScope.SOFT,
            archived = true
        )

        whenever(blockTypeRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))
        whenever(blockTypeRepository.save(any())).thenAnswer { it.arguments[0] }

        blockTypeService.archiveBlockType(existing.id!!, false)

        val captor = argumentCaptor<BlockTypeEntity>()
        verify(blockTypeRepository).save(captor.capture())
        assertFalse(captor.firstValue.archived)

        verify(activityService).logActivity(
            activity = eq(okuri.core.enums.activity.Activity.BLOCK_TYPE),
            operation = eq(okuri.core.enums.util.OperationType.RESTORE),
            userId = any(),
            organisationId = eq(existing.organisationId),
            targetId = eq(existing.id),
            additionalDetails = Mockito.contains("archive=false")
        )
    }

    @Test
    fun `archiveBlockType no-ops when status unchanged`() {
        // Scenario: Calling archive with the current status does nothing
        val existing = BlockFactory.createType(
            orgId = orgId,
            key = "invoice_header",
            version = 3,
            strictness = BlockValidationScope.SOFT,
            archived = true
        )

        whenever(blockTypeRepository.findById(existing.id!!)).thenReturn(Optional.of(existing))
        blockTypeService.archiveBlockType(existing.id!!, true)

        verify(blockTypeRepository, never()).save(any())
        verify(activityService, never()).logActivity(any(), any(), any(), any(), any(), any())
    }
}
