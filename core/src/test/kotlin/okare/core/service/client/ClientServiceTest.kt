package okare.core.service.client

import io.github.oshai.kotlinlogging.KLogger
import okare.core.entity.client.ClientEntity
import okare.core.models.client.Client
import okare.core.models.client.request.ClientCreationRequest
import okare.core.repository.client.ClientRepository
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
import org.springframework.security.access.AccessDeniedException
import java.util.*
import okare.core.models.user.Address

@ExtendWith(MockitoExtension::class)
@WithUserPersona(
    userId = "11111111-1111-1111-1111-111111111111",
    email = "testuser@email.com",
    displayName = "Test User",
    roles = [OrganisationRole(organisationId = "org-1", role = "OWNER")]
)
class ClientServiceTest {
    @Mock
    private lateinit var repository: ClientRepository

    @Mock
    private lateinit var authTokenService: AuthTokenService

    @Mock
    private lateinit var logger: KLogger

    @InjectMocks
    private lateinit var clientService: ClientService

    private val userId = UUID.fromString("11111111-1111-1111-1111-111111111111")
    private val clientId = UUID.fromString("22222222-2222-2222-2222-222222222222")

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        Mockito.`when`(authTokenService.getUserId()).thenReturn(userId)
    }

    @Test
    fun `getUserClients returns clients for user`() {
        val clientEntity = ClientEntity(
            id = clientId,
            userId = userId,
            name = "Test Client",
            address = Address(
                street = "123 Test St",
                city = "Testville",
                state = "TS",
                postalCode = "12345",
                country = "Testland"
            ),
            phone = "1234567890",
            ndisNumber = "NDIS123"
        )
        Mockito.`when`(repository.findByUserId(userId)).thenReturn(listOf(clientEntity))
        val result = clientService.getUserClients()
        assertEquals(1, result.size)
        assertEquals(clientId, result[0].id)
    }

    @Test
    fun `getClientById returns client if exists`() {
        val clientEntity = ClientEntity(
            id = clientId,
            userId = userId,
            name = "Test Client",
            address = Address(
                street = "123 Test St",
                city = "Testville",
                state = "TS",
                postalCode = "12345",
                country = "Testland"
            ),
            phone = "1234567890",
            ndisNumber = "NDIS123"
        )
        Mockito.`when`(repository.findById(clientId)).thenReturn(Optional.of(clientEntity))
        val result = clientService.getClientById(clientId)
        assertEquals(clientId, result.id)
    }

    @Test
    fun `getClientById throws if not found`() {
        Mockito.`when`(repository.findById(clientId)).thenReturn(Optional.empty())
        assertThrows<NoSuchElementException> {
            clientService.getClientById(clientId)
        }
    }

    @Test
    fun `createClient saves and returns new client`() {
        val request = ClientCreationRequest(
            name = "New Client",
            address = Address(
                street = "456 New St",
                city = "Newville",
                state = "NS",
                postalCode = "67890",
                country = "Newland"
            ),
            phone = "0987654321",
            ndisNumber = "NDIS456"
        )
        val clientEntity = ClientEntity(
            id = clientId,
            userId = userId,
            name = request.name,
            address = request.address,
            phone = request.phone,
            ndisNumber = request.ndisNumber
        )
        Mockito.`when`(repository.save(any(ClientEntity::class.java))).thenReturn(clientEntity)
        val result = clientService.createClient(request)
        assertEquals(clientId, result.id)
        assertEquals(request.name, result.name)
    }

    @Test
    fun `updateClient updates and returns client`() {
        val client = Client(
            id = clientId,
            userId = userId,
            name = "Updated Name",
            address = Address(
                street = "789 Updated St",
                city = "Updateville",
                state = "UP",
                postalCode = "54321",
                country = "Updateland"
            ),
            phone = "1112223333",
            ndisNumber = "NDIS789"
        )
        val clientEntity = ClientEntity(
            id = clientId,
            userId = userId,
            name = "Old Name",
            address = Address(
                street = "Old Address",
                city = "Oldville",
                state = "OD",
                postalCode = "00000",
                country = "Oldland"
            ),
            phone = "0000000000",
            ndisNumber = "NDIS000"
        )
        Mockito.`when`(repository.findById(clientId)).thenReturn(Optional.of(clientEntity))
        Mockito.`when`(repository.save(any(ClientEntity::class.java))).thenReturn(clientEntity.copy(
            name = client.name,
            address = client.address,
            phone = client.phone,
            ndisNumber = client.ndisNumber
        ))
        val result = clientService.updateClient(client)
        assertEquals(clientId, result.id)
        assertEquals("Updated Name", result.name)
    }

    @Test
    fun `deleteClient deletes client`() {
        val client = Client(
            id = clientId,
            userId = userId,
            name = "To Delete",
            address = Address(
                street = "To Delete",
                city = "Deleteville",
                state = "DL",
                postalCode = "99999",
                country = "Deleteland"
            ),
            phone = "0000000000",
            ndisNumber = "NDIS000"
        )
        Mockito.doNothing().`when`(repository).deleteById(clientId)
        clientService.deleteClient(client)
        Mockito.verify(repository).deleteById(clientId)
    }

    @Test
    fun `updateClient throws if client not found`() {
        val client = Client(
            id = clientId,
            userId = userId,
            name = "Nonexistent",
            address = Address(
                street = "Nonexistent",
                city = "Nowhere",
                state = "NO",
                postalCode = "00000",
                country = "Nowhereland"
            ),
            phone = "0000000000",
            ndisNumber = "NDIS000"
        )
        Mockito.`when`(repository.findById(clientId)).thenReturn(Optional.empty())
        assertThrows<NoSuchElementException> {
            clientService.updateClient(client)
        }
    }

    @Test
    fun `deleteClient does not throw if client does not exist`() {
        val client = Client(
            id = clientId,
            userId = userId,
            name = "Nonexistent",
            address = Address(
                street = "Nonexistent",
                city = "Nowhere",
                state = "NO",
                postalCode = "00000",
                country = "Nowhereland"
            ),
            phone = "0000000000",
            ndisNumber = "NDIS000"
        )
        Mockito.doNothing().`when`(repository).deleteById(clientId)
        clientService.deleteClient(client)
        Mockito.verify(repository).deleteById(clientId)
    }
} 