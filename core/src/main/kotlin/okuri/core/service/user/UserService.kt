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

    /**
     * Retrieve the UserEntity for the currently authenticated session.
     *
     * @return The UserEntity corresponding to the current session's user ID.
     * @throws NotFoundException if no user exists for the session user ID.
     * @throws IllegalArgumentException if an underlying call (repository or auth token service) rejects the input.
     */
    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getUserFromSession(): UserEntity {
        return authTokenService.getUserId().let {
            findOrThrow { repository.findById(it) }.apply {
                logger.info { "Retrieved user profile for ID: $it" }
            }
        }
    }

    /**
     * Retrieves the user entity for the given user ID.
     *
     * @param id The UUID of the user to retrieve.
     * @return The UserEntity with the specified ID.
     * @throws NotFoundException if no user exists with the given ID.
     */
    @Throws(NotFoundException::class)
    fun getUserById(id: UUID): UserEntity {
        return findOrThrow { repository.findById(id) }
    }

    /**
     * Update the current session user's profile with the provided user details.
     *
     * Validates that the session user ID matches `user.id`, applies the updatable fields to the persisted entity,
     * saves the entity, and returns the updated model.
     *
     * @param user The user model containing updated fields; `user.id` must match the authenticated session user ID.
     * @return The updated `User` model reflecting persisted changes.
     * @throws NotFoundException if no persisted user exists with `user.id`.
     * @throws AccessDeniedException if the session user ID does not match `user.id`.
     * @throws IllegalArgumentException for invalid arguments propagated from repository operations.
     */
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
     * Deletes the user identified by [userId] and any associated membership records.
     *
     * Ensures the user exists, then removes the user and related membership entities in a single transaction.
     *
     * @param userId The UUID of the user to delete.
     * @throws NotFoundException If no user exists with the given ID.
     */
    @Transactional
    @Throws(NotFoundException::class)
    fun deleteUserProfile(userId: UUID) {
        findOrThrow { repository.findById(userId) } // Ensure the user exists before deletion
        repository.deleteById(userId)
        logger.info { "Deleted user profile with ID: $userId" }
    }
}