package okuri.core.configuration.auth

import org.springframework.data.domain.AuditorAware
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import java.util.*

class SecurityAuditorAware : AuditorAware<UUID> {
    override fun getCurrentAuditor(): Optional<UUID> {
        val auth = SecurityContextHolder.getContext().authentication ?: return Optional.empty()
        if (!auth.isAuthenticated) return Optional.empty()
        val jwt = (auth.principal as? Jwt) ?: return Optional.empty()
        val sub = jwt.subject ?: jwt.claims["sub"]?.toString() ?: return Optional.empty()
        return try {
            Optional.of(UUID.fromString(sub))
        } catch (_: IllegalArgumentException) {
            Optional.empty()
        }
    }
}