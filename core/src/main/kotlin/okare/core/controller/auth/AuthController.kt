package okare.core.controller.auth

import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.enums.auth.SocialProviders
import okare.core.models.auth.AuthenticationCredentials
import okare.core.models.auth.RegistrationConfirmation
import okare.core.service.auth.AuthService
import org.springframework.http.ResponseEntity
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

    @PostMapping("/login")
    suspend fun login(@RequestBody credentials: AuthenticationCredentials): ResponseEntity<Unit> {
        service.loginWithEmailPasswordCredentials(credentials)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/register")
    suspend fun register(@RequestBody credentials: AuthenticationCredentials): ResponseEntity<Unit> {

        service.registerWithEmailPasswordCredentials(credentials)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/confirm-otp")
    suspend fun confirmOtp(@RequestBody userDetails: RegistrationConfirmation): ResponseEntity<Unit> {

        service.confirmEmailSignupWithOTP(userDetails)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/social/{provider}")
    suspend fun authenticateSocial(@PathVariable provider: SocialProviders): RedirectView {
        return service.authenticateWithSocialProvider(provider)
    }

    @PostMapping("/resend-otp")
    suspend fun resendOtp(@RequestBody email: String): ResponseEntity<Unit> {
        service.handleResendOTP(email)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/signout")
    suspend fun signout(): ResponseEntity<Unit> {
        service.handleUserSignout()
        return ResponseEntity.noContent().build()
    }
}