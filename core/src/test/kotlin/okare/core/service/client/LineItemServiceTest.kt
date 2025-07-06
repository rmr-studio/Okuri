package okare.core.service.client

import io.github.oshai.kotlinlogging.KLogger
import okare.core.entity.invoice.LineItemEntity
import okare.core.models.client.request.LineItemCreationRequest
import okare.core.models.invoice.LineItem
import okare.core.repository.client.LineItemRepository
import okare.core.service.auth.AuthTokenService
import okare.core.util.WithUserPersona
import okare.core.util.OrganisationRole
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito
import org.mockito.MockitoAnnotations
import org.mockito.junit.jupiter.MockitoExtension
import java.util.*

@ExtendWith(MockitoExtension::class)
@WithUserPersona(
    userId = "11111111-1111-1111-1111-111111111111",
    email = "testuser@email.com",
    displayName = "Test User",
    roles = [OrganisationRole(organisationId = "org-1", role = "OWNER")]
)
class LineItemServiceTest {
    @Mock
    private lateinit var repository: LineItemRepository

    @Mock
    private lateinit var authTokenService: AuthTokenService

    @Mock
    private lateinit var logger: KLogger

    @InjectMocks
    private lateinit var lineItemService: LineItemService

    private val userId = UUID.fromString("11111111-1111-1111-1111-111111111111")
    private val lineItemId = UUID.fromString("33333333-3333-3333-3333-333333333333")

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        Mockito.`when`(authTokenService.getUserId()).thenReturn(userId)
    }

    @Test
    fun `getUserLineItems returns line items for user`() {
        val lineItemEntity = LineItemEntity(
            id = lineItemId,
            userId = userId,
            name = "Test Line Item",
            description = "Test Description",
            chargeRate = 100.0
        )
        Mockito.`when`(repository.findByUserId(userId)).thenReturn(listOf(lineItemEntity))
        val result = lineItemService.getUserLineItems()
        assertEquals(1, result.size)
        assertEquals(lineItemId, result[0].id)
    }

    @Test
    fun `getLineItemById returns line item if exists`() {
        val lineItemEntity = LineItemEntity(
            id = lineItemId,
            userId = userId,
            name = "Test Line Item",
            description = "Test Description",
            chargeRate = 100.0
        )
        Mockito.`when`(repository.findById(lineItemId)).thenReturn(Optional.of(lineItemEntity))
        val result = lineItemService.getLineItemById(lineItemId)
        assertEquals(lineItemId, result.id)
    }

    @Test
    fun `getLineItemById throws if not found`() {
        Mockito.`when`(repository.findById(lineItemId)).thenReturn(Optional.empty())
        assertThrows<NoSuchElementException> {
            lineItemService.getLineItemById(lineItemId)
        }
    }

    @Test
    fun `createLineItem saves and returns new line item`() {
        val request = LineItemCreationRequest(
            name = "New Line Item",
            description = "New Description",
            chargeRate = 200.0
        )
        val lineItemEntity = LineItemEntity(
            id = lineItemId,
            userId = userId,
            name = request.name,
            description = request.description,
            chargeRate = request.chargeRate
        )
        Mockito.`when`(repository.save(any(LineItemEntity::class.java))).thenReturn(lineItemEntity)
        val result = lineItemService.createLineItem(request)
        assertEquals(lineItemId, result.id)
        assertEquals(request.name, result.name)
    }

    @Test
    fun `updateLineItem updates and returns line item`() {
        val lineItem = LineItem(
            id = lineItemId,
            userId = userId,
            name = "Updated Name",
            description = "Updated Description",
            chargeRate = 300.0
        )
        val lineItemEntity = LineItemEntity(
            id = lineItemId,
            userId = userId,
            name = "Old Name",
            description = "Old Description",
            chargeRate = 100.0
        )
        Mockito.`when`(repository.findById(lineItemId)).thenReturn(Optional.of(lineItemEntity))
        Mockito.`when`(repository.save(any(LineItemEntity::class.java))).thenReturn(lineItemEntity.copy(
            name = lineItem.name,
            description = lineItem.description,
            chargeRate = lineItem.chargeRate
        ))
        val result = lineItemService.updateLineItem(lineItem)
        assertEquals(lineItemId, result.id)
        assertEquals("Updated Name", result.name)
    }

    @Test
    fun `deleteLineItem deletes line item`() {
        val lineItem = LineItem(
            id = lineItemId,
            userId = userId,
            name = "To Delete",
            description = "To Delete",
            chargeRate = 100.0
        )
        Mockito.doNothing().`when`(repository).deleteById(lineItemId)
        lineItemService.deleteLineItem(lineItem)
        Mockito.verify(repository).deleteById(lineItemId)
    }

    @Test
    fun `updateLineItem throws if line item not found`() {
        val lineItem = LineItem(
            id = lineItemId,
            userId = userId,
            name = "Nonexistent",
            description = "Nonexistent",
            chargeRate = 100.0
        )
        Mockito.`when`(repository.findById(lineItemId)).thenReturn(Optional.empty())
        assertThrows<NoSuchElementException> {
            lineItemService.updateLineItem(lineItem)
        }
    }

    @Test
    fun `deleteLineItem does not throw if line item does not exist`() {
        val lineItem = LineItem(
            id = lineItemId,
            userId = userId,
            name = "Nonexistent",
            description = "Nonexistent",
            chargeRate = 100.0
        )
        Mockito.doNothing().`when`(repository).deleteById(lineItemId)
        lineItemService.deleteLineItem(lineItem)
        Mockito.verify(repository).deleteById(lineItemId)
    }
} 