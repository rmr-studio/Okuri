package okuri.core.service.util.factory

import okuri.core.entity.user.UserEntity
import java.time.ZonedDateTime
import java.util.*

object UserFactory {

    /**
     * Creates a UserEntity populated with the given fields and reasonable defaults.
     *
     * Useful for producing test or prototype user instances without supplying every field.
     *
     * @param id The user's UUID; defaults to a newly generated random UUID.
     * @param name The user's display name; defaults to "Test User".
     * @param email The user's email address; defaults to "email@email.com".
     * @param phone The user's phone number; defaults to "1234567890".
     * @return A UserEntity with the provided values, `avatarUrl` set to `null`, and `createdAt` set to the current time.
     */
    fun createUser(
        id: UUID = UUID.randomUUID(),
        name: String = "Test User",
        email: String = "email@email.com",
        phone: String = "1234567890",
    ): UserEntity {
        return UserEntity(
            id = id,
            name = name,
            email = email,
            phone = phone,
            avatarUrl = null,
            createdAt = ZonedDateTime.now()
        )
    }

}