package okuri.core.configuration.auth

import org.springframework.data.domain.AuditorAware
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import java.util.*

class SecurityAuditorAware : AuditorAware<UUID> {
    override fun getCurrentAuditor(): Optional<UUID> {
        val authentication = SecurityContextHolder.getContext().authentication

        // Example: assuming JWT principal stores userId as UUID
        authentication.let {
            if (it == null || it.principal !is Jwt || !authentication.isAuthenticated) {
                return Optional.empty()
            }

            it.principal as Jwt
        }.let { jwt ->
            val userId = jwt.claims["sub"] ?: Optional.empty<UUID>()
            return Optional.of(UUID.fromString(userId.toString()))
        }
    }
}