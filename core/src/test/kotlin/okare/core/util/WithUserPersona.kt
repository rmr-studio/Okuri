package okare.core.util

import okare.core.enums.invoice.InvoiceStatus // Adjust if you have OrganisationRoles elsewhere
import org.junit.jupiter.api.extension.AfterEachCallback
import org.junit.jupiter.api.extension.BeforeEachCallback
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.extension.ExtensionContext
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import java.time.Instant
import java.util.*

@Target(AnnotationTarget.ANNOTATION_CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class OrganisationRole(val organisationId: String, val role: String)

@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
@ExtendWith(WithUserPersonaExtension::class)
annotation class WithUserPersona(
    val userId: String,
    val email: String,
    val displayName: String = "",
    val roles: Array<OrganisationRole> = [],
    val expirationSeconds: Long = 3600
)

class WithUserPersonaExtension : BeforeEachCallback, AfterEachCallback {
    override fun beforeEach(context: ExtensionContext) {
        val annotation = findEffectiveAnnotation(context)
        if (annotation != null) {
            val jwtString = JwtTestUtil.createTestJwt(
                id = annotation.userId,
                email = annotation.email,
                displayName = annotation.displayName.ifEmpty { null },
                roles = annotation.roles.map { OrganisationRole(it.organisationId, it.role) },
                expirationSeconds = annotation.expirationSeconds
            )
            val claims = mutableMapOf<String, Any>(
                "sub" to annotation.userId,
                "email" to annotation.email,
                "role" to "authenticated",
                "iss" to "https://abc.supabase.co/auth/v1",
                "aud" to "authenticated"
            )
            if (annotation.displayName.isNotEmpty()) {
                claims["user_metadata"] = mapOf("displayName" to annotation.displayName)
            }
            if (annotation.roles.isNotEmpty()) {
                claims["app_metadata"] = mapOf("roles" to annotation.roles.map { mapOf("organisation_id" to it.organisationId, "role" to it.role) })
            }
            val jwt = Jwt(
                jwtString,
                Instant.now(),
                Instant.now().plusSeconds(annotation.expirationSeconds),
                mapOf("alg" to "HS256", "typ" to "JWT"),
                claims
            )
            val authorities = annotation.roles.map {
                SimpleGrantedAuthority("ROLE_${it.organisationId}_${it.role.uppercase(Locale.ROOT)}")
            }
            val auth = JwtAuthenticationToken(jwt, authorities)
            SecurityContextHolder.getContext().authentication = auth
        }
    }
    override fun afterEach(context: ExtensionContext?) {
        SecurityContextHolder.clearContext()
    }
    private fun findEffectiveAnnotation(context: ExtensionContext): WithUserPersona? {
        val methodAnnotation = context.testMethod
            .map { it.getAnnotation(WithUserPersona::class.java) }
            .orElse(null)
        if (methodAnnotation != null) {
            return methodAnnotation
        }
        return context.testClass
            .map { it.getAnnotation(WithUserPersona::class.java) }
            .orElse(null)
    }
} 