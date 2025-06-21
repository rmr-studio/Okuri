package okare.core.controller.auth

import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.service.auth.AuthService
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.view.RedirectView

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication and authorization")
class AuthController(private val service: AuthService) {
    @GetMapping("/auth/callback")
    suspend fun handleAuthCallback(
        @RequestParam("code") code: String?,
        @RequestParam("next", required = false) next: String?,
        @RequestHeader("X-Forwarded-Host", required = false) forwardedHost: String?
    ): RedirectView {

        return service.handleThirdPartyPKCECallback(
            code = code,
            next = next,
            forwardedHost = forwardedHost
        )
    }

}