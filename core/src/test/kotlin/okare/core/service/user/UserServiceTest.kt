package okare.core.service.user

import io.github.oshai.kotlinlogging.KLogger
import okare.core.entity.user.UserEntity
import okare.core.models.user.Address
import okare.core.models.user.User
import okare.core.repository.user.UserRepository
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

@ExtendWith(MockitoExtension::class)
@WithUserPersona(
    userId = "11111111-1111-1111-1111-111111111111",
    email = "testuser@email.com",
    displayName = "Test User",
    roles = [OrganisationRole(organisationId = "org-1", role = "OWNER")]
)
class UserServiceTest {
    @Mock
    private lateinit var repository: UserRepository

    @Mock
    private lateinit var authTokenService: AuthTokenService

    @Mock
    private lateinit var logger: KLogger

    @InjectMocks
    private lateinit var userService: UserService

    private val userId = UUID.fromString("11111111-1111-1111-1111-111111111111")
    private val address = Address("123 Test St", "Testville", "TS", "12345", "Testland")
    private val userEntity = UserEntity(
        id = userId,
        name = "Test User",
        email = "testuser@email.com",
        phone = "1234567890",
        company = null,
        chargeRate = null,
        address = address,
        paymentDetails = null
    )

    @BeforeEach
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        Mockito.`when`(authTokenService.getUserId()).thenReturn(userId)
    }

    @Test
    fun `getUserFromSession returns user entity`() {
        Mockito.`when`(repository.findById(userId)).thenReturn(Optional.of(userEntity))
        val result = userService.getUserFromSession()
        assertEquals(userId, result.id)
    }

    @Test
    fun `getUserById returns user entity`() {
        Mockito.`when`(repository.findById(userId)).thenReturn(Optional.of(userEntity))
        val result = userService.getUserById(userId)
        assertEquals(userId, result.id)
    }

    @Test
    fun `getUserById throws if not found`() {
        Mockito.`when`(repository.findById(userId)).thenReturn(Optional.empty())
        assertThrows<NoSuchElementException> {
            userService.getUserById(userId)
        }
    }

    @Test
    fun `updateUserDetails updates and returns user`() {
        val user = User(
            id = userId,
            name = "Updated Name",
            email = "updated@email.com",
            phone = "0987654321",
            company = null,
            chargeRate = null,
            address = address,
            paymentDetails = null
        )
        Mockito.`when`(repository.findById(userId)).thenReturn(Optional.of(userEntity))
        Mockito.`when`(repository.save(any(UserEntity::class.java))).thenReturn(userEntity.copy(
            name = user.name,
            email = user.email,
            phone = user.phone
        ))
        val result = userService.updateUserDetails(user)
        assertEquals(userId, result.id)
        assertEquals("Updated Name", result.name)
    }

    @Test
    fun `updateUserDetails throws if session user id does not match`() {
        val otherUser = User(
            id = UUID.randomUUID(),
            name = "Other",
            email = "other@email.com",
            phone = "0000000000",
            company = null,
            chargeRate = null,
            address = address,
            paymentDetails = null
        )
        assertThrows<AccessDeniedException> {
            userService.updateUserDetails(otherUser)
        }
    }

    @Test
    fun `deleteUserProfile deletes user`() {
        Mockito.`when`(repository.findById(userId)).thenReturn(Optional.of(userEntity))
        Mockito.doNothing().`when`(repository).deleteById(userId)
        userService.deleteUserProfile(userId)
        Mockito.verify(repository).deleteById(userId)
    }

    @Test
    fun `deleteUserProfile throws if user not found`() {
        Mockito.`when`(repository.findById(userId)).thenReturn(Optional.empty())
        assertThrows<NoSuchElementException> {
            userService.deleteUserProfile(userId)
        }
    }
} 