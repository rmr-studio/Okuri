package okare.core.util

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.MACSigner
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import okare.core.enums.invoice.InvoiceStatus
import java.time.Instant
import java.util.*

object JwtTestUtil {
    fun createTestJwt(
        id: String,
        email: String,
        displayName: String? = null,
        roles: List<OrganisationRole> = emptyList(),
        customClaims: Map<String, Any> = emptyMap(),
        expirationSeconds: Long = 3600,
        issuer: String = "https://abc.supabase.co/auth/v1",
        secret: String = "test-secret-1234567890abcdef1234567890abcdef"
    ): String {
        val header = JWSHeader.Builder(JWSAlgorithm.HS256)
            .type(com.nimbusds.jose.JOSEObjectType.JWT)
            .build()

        val now = Instant.now()
        val claimsBuilder = JWTClaimsSet.Builder()
            .subject(id)
            .issuer(issuer)
            .audience("authenticated")
            .issueTime(Date.from(now))
            .expirationTime(Date.from(now.plusSeconds(expirationSeconds)))
            .claim("email", email)
            .claim("role", "authenticated")

        if (displayName != null) {
            claimsBuilder.claim("user_metadata", mapOf("displayName" to displayName))
        }

        if (roles.isNotEmpty()) {
            claimsBuilder.claim("app_metadata", mapOf("roles" to roles.map {
                mapOf(
                    "organisation_id" to it.organisationId,
                    "role" to it.role
                )
            }))
        }

        customClaims.forEach { (k, v) -> claimsBuilder.claim(k, v) }

        val claims = claimsBuilder.build()

        val signedJWT = SignedJWT(header, claims)
        val signer = MACSigner(secret.toByteArray(Charsets.UTF_8))
        signedJWT.sign(signer)

        return signedJWT.serialize()
    }
} 