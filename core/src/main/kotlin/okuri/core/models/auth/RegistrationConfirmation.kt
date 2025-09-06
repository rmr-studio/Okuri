package okuri.core.models.auth

data class RegistrationConfirmation(val email: String, val password: String, val otp: String)