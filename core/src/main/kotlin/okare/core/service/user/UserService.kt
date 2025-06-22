package okare.core.service.user

import io.github.oshai.kotlinlogging.KLogger
import jakarta.transaction.Transactional
import okare.core.entity.user.UserEntity
import okare.core.entity.user.toModel
import okare.core.exceptions.NotFoundException
import okare.core.models.user.User
import okare.core.repository.user.UserRepository
import okare.core.service.auth.AuthTokenService
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import java.util.*

@Service
class UserService(
    private val repository: UserRepository,
    private val authTokenService: AuthTokenService,
    private val logger: KLogger
) {

    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getUserFromSession(): UserEntity {
        return authTokenService.getUserId().let {
            findOrThrow(it, repository::findById).apply {
                logger.info { "Retrieved user profile for ID: $it" }
            }
        }
    }

    @Throws(NotFoundException::class)
    fun getUserById(id: UUID): UserEntity {
        return findOrThrow(id, repository::findById)
    }

    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun updateUserDetails(user: User): User {
        // Validate Session id matches target user
        authTokenService.getUserId().run {
            if (this != user.id) {
                throw AccessDeniedException("Session user ID does not match provided user ID")
            }
        }

        findOrThrow(user.id, repository::findById).apply {
            name = user.name
            email = user.email
            phone = user.phone
            company = user.company
            chargeRate = user.chargeRate
            paymentDetails = user.paymentDetails
        }.run {
            repository.save(this)
            logger.info { "Updated user profile with ID: ${this.id}" }
            return this.toModel()
        }
    }

    /**
     * Transactional given the need to delete all membership entities associated with this user from all related organisations.
     */
    @Transactional
    @Throws(NotFoundException::class)
    fun deleteUserProfile(userId: UUID) {
        findOrThrow(userId, repository::findById) // Ensure the user exists before deletion
        repository.deleteById(userId)
        logger.info { "Deleted user profile with ID: $userId" }
    }
}