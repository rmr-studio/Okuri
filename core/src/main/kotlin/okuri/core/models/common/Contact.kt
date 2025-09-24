package okuri.core.models.common

data class Contact(
    val email: String,
    val phone: String? = null,
    val address: Address? = null,
    var additionalContacts: Map<String, String>? = null
)