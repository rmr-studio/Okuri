package okare.core.models.client

import okare.core.models.user.Address
import java.util.*

data class Client(
    val id: UUID,
    val userId: UUID,
    var name: String,
    var contactDetails: ContactDetails? = null,
    var attributes: Map<String, Any> = emptyMap(), // E.g., {"industry": "Healthcare", "size": "50-100"}
)

data class ContactDetails(
    var email: String? = null,
    var phone: String? = null,
    var address: Address? = null,
    var additionalContacts: Map<String, String> = emptyMap() // E.g., {"billing_email": "..."}
)