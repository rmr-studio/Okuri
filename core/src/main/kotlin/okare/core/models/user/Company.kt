package okare.core.models.user

data class Company(
    val name: String,
    val businessNumber: String? = null,
    val taxId: String? = null,
    val paymentDetails: PaymentDetails? = null, // Optional, can be null if not applicable
    val customAttributes: Map<String, Any> = emptyMap() // JSONB for industry-specific fields
)