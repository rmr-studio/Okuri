package okare.core.models.auth

data class RegistrationConfirmation(val email: String, val password: String, val otp: String)