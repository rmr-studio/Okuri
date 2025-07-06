package okare.core.service.invoice

import io.github.oshai.kotlinlogging.KLogger
import okare.core.entity.invoice.InvoiceEntity
import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.client.Client
import okare.core.models.invoice.Invoice
import okare.core.models.invoice.request.InvoiceCreationRequest
import okare.core.models.user.Address
import okare.core.models.user.User
import okare.core.repository.invoice.InvoiceRepository
import okare.core.service.auth.AuthTokenService
import okare.core.service.client.ClientService
import okare.core.service.pdf.DocumentGenerationService
import okare.core.service.user.UserService
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
import org.springframework.security.access.AccessDeniedException
import java.time.ZonedDateTime
import java.util.*

@ExtendWith(MockitoExtension::class)
@WithUserPersona(
    userId = "11111111-1111-1111-1111-111111111111",
    email = "testuser@email.com",
    displayName = "Test User",
    roles = [OrganisationRole(organisationId = "org-1", role = "OWNER")]
)
class InvoiceServiceTest {
    @Mock
    private lateinit var invoiceRepository: InvoiceRepository

    @Mock
    private lateinit var userService: UserService

    @Mock
    private lateinit var clientService: ClientService

    @Mock
    private lateinit var authTokenService: AuthTokenService

    @Mock
    private lateinit var documentGeneratorService: DocumentGenerationService

    @Mock
    private lateinit var logger: KLogger

    @InjectMocks
    private lateinit var invoiceService: InvoiceService

    private val userId = UUID.fromString("11111111-1111-1111-1111-111111111111")
    private val clientId = UUID.fromString("22222222-2222-2222-2222-222222222222")
    private val invoiceId = UUID.fromString("44444444-4444-4444-4444-444444444444")

    private val address = Address("123 Test St", "Testville", "TS", "12345", "Testland")
    private val user = User(userId, "Test User", "testuser@email.com", "1234567890", null, null, null, address, null)
    private val client = Client(clientId, userId, "Test Client", address, "NDIS123", "1234567890")
    private val invoiceEntity = InvoiceEntity(
        id = invoiceId,
        user = user,
        client = client,
        invoiceNumber = 1,
        items = emptyList(),
        amount = 100.0,
        currency = "AUD",
        status = InvoiceStatus.DRAFT,
        startDate = ZonedDateTime.now(),
        endDate = ZonedDateTime.now(),
        dueDate = ZonedDateTime.now()
    )

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        Mockito.`when`(authTokenService.getUserId()).thenReturn(userId)
    }

    @Test
    fun `getInvoicesByUserSession returns invoices for user`() {
        Mockito.`when`(invoiceRepository.findByUserId(userId)).thenReturn(listOf(invoiceEntity))
        val result = invoiceService.getInvoicesByUserSession()
        assertEquals(1, result.size)
        assertEquals(invoiceId, result[0].id)
    }

    @Test
    fun `getInvoiceById returns invoice if user owns it`() {
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoiceEntity))
        val result = invoiceService.getInvoiceById(invoiceId)
        assertEquals(invoiceId, result.id)
    }

    @Test
    fun `getInvoiceById throws if user does not own invoice`() {
        val otherUser = user.copy(id = UUID.randomUUID())
        val otherInvoice = invoiceEntity.copy(user = otherUser)
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(otherInvoice))
        assertThrows<AccessDeniedException> {
            invoiceService.getInvoiceById(invoiceId)
        }
    }

    @Test
    fun `createInvoice saves and returns new invoice`() {
        val request = InvoiceCreationRequest(
            client = client,
            items = emptyList(),
            amount = 200.0,
            currency = "AUD",
            status = InvoiceStatus.DRAFT,
            startDate = ZonedDateTime.now(),
            endDate = ZonedDateTime.now(),
            dueDate = ZonedDateTime.now()
        )
        Mockito.`when`(invoiceRepository.findMaxInvoiceNumberByUserId(userId)).thenReturn(1)
        Mockito.`when`(userService.getUserById(userId)).thenReturn(user)
        Mockito.`when`(clientService.getClientById(clientId)).thenReturn(client)
        Mockito.`when`(invoiceRepository.save(any(InvoiceEntity::class.java))).thenReturn(invoiceEntity)
        val result = invoiceService.createInvoice(request)
        assertEquals(invoiceId, result.id)
    }

    @Test
    fun `updateInvoice updates and returns invoice`() {
        val invoice = Invoice(
            id = invoiceId,
            user = user,
            client = client,
            invoiceNumber = "2",
            items = emptyList(),
            amount = 300.0,
            currency = "AUD",
            status = InvoiceStatus.DRAFT,
            startDate = ZonedDateTime.now(),
            endDate = ZonedDateTime.now(),
            dueDate = ZonedDateTime.now()
        )
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoiceEntity))
        Mockito.`when`(invoiceRepository.save(any(InvoiceEntity::class.java))).thenReturn(invoiceEntity.copy(amount = 300.0))
        val result = invoiceService.updateInvoice(invoice)
        assertEquals(invoiceId, result.id)
        assertEquals(300.0, result.amount)
    }

    @Test
    fun `cancelInvoice cancels invoice if not paid or already cancelled`() {
        val draftInvoice = invoiceEntity.copy(status = InvoiceStatus.DRAFT)
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(draftInvoice))
        Mockito.`when`(invoiceRepository.save(any(InvoiceEntity::class.java))).thenReturn(draftInvoice.copy(status = InvoiceStatus.CANCELLED))
        val result = invoiceService.cancelInvoice(draftInvoice.toModel())
        assertEquals(InvoiceStatus.CANCELLED, result.status)
    }

    @Test
    fun `cancelInvoice throws if invoice is paid`() {
        val paidInvoice = invoiceEntity.copy(status = InvoiceStatus.PAID)
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(paidInvoice))
        assertThrows<IllegalArgumentException> {
            invoiceService.cancelInvoice(paidInvoice.toModel())
        }
    }

    @Test
    fun `cancelInvoice throws if invoice is already cancelled`() {
        val cancelledInvoice = invoiceEntity.copy(status = InvoiceStatus.CANCELLED)
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(cancelledInvoice))
        assertThrows<IllegalArgumentException> {
            invoiceService.cancelInvoice(cancelledInvoice.toModel())
        }
    }

    @Test
    fun `deleteInvoice deletes invoice if not paid or cancelled`() {
        val draftInvoice = invoiceEntity.copy(status = InvoiceStatus.DRAFT)
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(draftInvoice))
        Mockito.doNothing().`when`(invoiceRepository).deleteById(invoiceId)
        invoiceService.deleteInvoice(draftInvoice.toModel())
        Mockito.verify(invoiceRepository).deleteById(invoiceId)
    }

    @Test
    fun `deleteInvoice throws if invoice is paid`() {
        val paidInvoice = invoiceEntity.copy(status = InvoiceStatus.PAID)
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(paidInvoice))
        assertThrows<IllegalArgumentException> {
            invoiceService.deleteInvoice(paidInvoice.toModel())
        }
    }

    @Test
    fun `deleteInvoice throws if invoice is cancelled`() {
        val cancelledInvoice = invoiceEntity.copy(status = InvoiceStatus.CANCELLED)
        Mockito.`when`(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(cancelledInvoice))
        assertThrows<IllegalArgumentException> {
            invoiceService.deleteInvoice(cancelledInvoice.toModel())
        }
    }
} 