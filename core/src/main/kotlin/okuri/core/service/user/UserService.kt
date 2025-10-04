package okuri.core.service.user

import io.github.oshai.kotlinlogging.KLogger
import okuri.core.entity.organisation.toEntity
import okuri.core.entity.user.UserEntity
import okuri.core.entity.user.toModel
import okuri.core.exceptions.NotFoundException
import okuri.core.models.user.User
import okuri.core.repository.user.UserRepository
import okuri.core.service.auth.AuthTokenService
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
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
            findOrThrow { repository.findById(it) }.apply {
                logger.info { "Retrieved user profile for ID: $it" }
            }
        }
    }

    @Throws(NotFoundException::class)
    fun getUserById(id: UUID): UserEntity {
        return findOrThrow { repository.findById(id) }
    }

    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun updateUserDetails(user: User): User {
        // Validate Session id matches target user
        authTokenService.getUserId().run {
            if (this != user.id) {
                throw AccessDeniedException("Session user ID does not match provided user ID")
            }
        }

        findOrThrow { repository.findById(user.id) }.apply {
            name = user.name
            email = user.email
            phone = user.phone
            avatarUrl = user.avatarUrl
            defaultOrganisation = user.defaultOrganisation?.toEntity()
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
        findOrThrow { repository.findById(userId) } // Ensure the user exists before deletion
        repository.deleteById(userId)
        logger.info { "Deleted user profile with ID: $userId" }
    }
}