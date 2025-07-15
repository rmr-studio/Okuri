package okare.core.models.user

data class Company(
    val name: String,
    val businessNumber: String? = null,
    val taxId: String? = null,
    val customAttributes: Map<String, Any> = emptyMap() // JSONB for industry-specific fields
)