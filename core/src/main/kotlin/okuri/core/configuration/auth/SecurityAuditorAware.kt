package okuri.core.configuration.auth

import org.springframework.data.domain.AuditorAware
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import java.util.*

class SecurityAuditorAware : AuditorAware<UUID> {
    /**
     * Resolves the current auditor as a UUID from the Spring Security context.
     *
     * Returns Optional.empty() when there is no authentication, the principal is not a Jwt, or the authentication is not authenticated.
     * When present, the method reads the JWT `sub` claim and converts it to a UUID, returning that UUID wrapped in an Optional.
     *
     * @return an Optional containing the current auditor's UUID when available
     */
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