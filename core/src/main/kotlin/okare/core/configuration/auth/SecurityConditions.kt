package okare.core.configuration.auth

import okare.core.models.client.Client
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component

@Component
class SecurityConditions {

    fun doesUserOwnClient(client: Client): Boolean {
        return SecurityContextHolder.getContext().authentication.principal.let {
            if (it !is Jwt) {
                return false
            }

            it.claims["sub"]
        } == client.userId
    }
}