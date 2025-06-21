package okare.core.service.auth

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.OtpType
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.user.UserInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okare.core.configuration.properties.ApplicationConfigurationProperties
import okare.core.enums.auth.SocialProviders
import okare.core.exceptions.ConflictException
import okare.core.exceptions.SupabaseException
import okare.core.models.auth.AuthenticationCredentials
import okare.core.models.auth.RegistrationConfirmation
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.web.servlet.view.RedirectView
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Service
class AuthService(private val client: SupabaseClient, private val config: ApplicationConfigurationProperties) {

    // Redirect responses

    suspend fun handleThirdPartyPKCECallback(
        code: String? = null,
        next: String? = null,
        forwardedHost: String? = null
    ): RedirectView {
        // Validate next parameter to prevent open redirects
        val safeNext = if (next != null && next.startsWith("/") && !next.startsWith("//")) {
            next
        } else {
            "/"
        }

        if (code != null) {
            try {
                // Exchange code for session using Supabase client

                client.auth.exchangeCodeForSession(code).run {
                    // If session is successfully retrieved, proceed with redirect
                    val isLocalEnv = config.profile == "development"
                    val redirectUrl = when {
                        isLocalEnv -> "${config.webOrigin}$safeNext"
                        forwardedHost != null && forwardedHost.matches("^[a-zA-Z0-9.-]+$".toRegex()) -> "https://$forwardedHost$safeNext"
                        else -> "${config.webOrigin}$safeNext"
                    }

                    return RedirectView(redirectUrl)
                }

            } catch (e: Exception) {
                // Log error and redirect to error page
                println("Auth error: ${e.message}")
                val errorMessage = withContext(Dispatchers.IO) {
                    URLEncoder.encode(e.message ?: "Unknown error", StandardCharsets.UTF_8.toString())
                }
                return RedirectView("${config.webOrigin}/auth/auth-code-error?error=$errorMessage")
            }
        }

        // If no code provided, redirect to error page
        return RedirectView("${config.webOrigin}/auth/auth-code-error")
    }

    // Authenticates with a social provider using PKCE flow
    suspend fun authenticateWithSocialProvider(provider: SocialProviders): RedirectView = withContext(Dispatchers.IO) {
        try {
            client.auth.signInWith(Google)
            RedirectView(config.webOrigin + "/api/auth/token/callback")
        } catch (e: Exception) {
            RedirectView("/auth/auth-code-error?error=${URLEncoder.encode(e.message ?: "OAuth failed", "UTF-8")}")
        }
    }

    suspend fun handleUserSignout(): String = withContext(Dispatchers.IO) {
        try {
            client.auth.signOut()
            "Sign-out successful"
        } catch (e: Exception) {
            throw SupabaseException(
                message = e.message ?: "Sign-out failed"
            )
        }
    }

    // Logs in a user with email and password credentials
    suspend fun loginWithEmailPasswordCredentials(credentials: AuthenticationCredentials): Boolean =
        withContext(Dispatchers.IO) {
            try {
                val (email, password) = credentials
                client.auth.signInWith(Email) {
                    this.email = email
                    this.password = password
                }
                true
            } catch (e: Exception) {
                throw AccessDeniedException(
                    e.message ?: "Login failed"
                )
            }
        }

    // Registers a user with email and password credentials
    suspend fun registerWithEmailPasswordCredentials(credentials: AuthenticationCredentials): Boolean =
        withContext(Dispatchers.IO) {
            try {
                val (email, password) = credentials
                val user = client.auth.signUpWith(Email) {
                    this.email = email
                    this.password = password
                }

                if (isUserObfuscated(user)) {
                    throw ConflictException(
                        "An account with this email already exists."
                    )
                }
                true
            } catch (e: ConflictException) {
                throw e // Re-throw if already handled
            } catch (e: Exception) {
                throw SupabaseException(e.message ?: "Registration failed")
            }
        }

    // Confirms email signup with OTP and signs in the user
    suspend fun confirmEmailSignupWithOTP(userDetails: RegistrationConfirmation): Boolean =
        withContext(Dispatchers.IO) {
            try {
                val (email, password, otp) = userDetails
                // Verify OTP for signup
                client.auth.verifyEmailOtp(
                    OtpType.Email.SIGNUP,
                    email,
                    otp
                )

                // Sign in the user after OTP verification
                client.auth.signInWith(Email) {
                    this.email = email
                    this.password = password
                }

                true // Return true if successful
            } catch (e: Exception) {
                throw AccessDeniedException(e.message ?: "OTP confirmation failed")
            }
        }


    // Resends OTP code to the user's email
    suspend fun handleResendOTP(email: String): Boolean = withContext(Dispatchers.IO) {
        try {
            client.auth.resendEmail(OtpType.Email.SIGNUP, email = email)
            true // Return true if OTP resend is successful
        } catch (e: Exception) {
            throw SupabaseException(
                "Failed to resend OTP: ${e.message}"
            )
        }
    }

    // Checks if the user object is obfuscated (email already registered)
    private fun isUserObfuscated(user: UserInfo?): Boolean {
        return user.let {
            if (it == null) return true

            it.userMetadata.let { metadata ->
                if (metadata == null) return true
                metadata.isEmpty()
            }
        }
    }

}