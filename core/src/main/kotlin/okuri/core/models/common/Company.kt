package okuri.core.models.common

data class Company(
    val name: String,
    val role: String? = null,
    val address: Address? = null,
    val website: String? = null,
    val taxId: String? = null,
    val registrationNumber: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val additionalInfo: Map<String, String>? = null
)