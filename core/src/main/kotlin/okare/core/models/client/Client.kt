package okare.core.models.client

import okare.core.models.template.Template
import okare.core.models.template.client.ClientTemplateFieldStructure
import java.util.*

data class Client(
    val id: UUID,
    val userId: UUID,
    var name: String,
    var contactDetails: ContactDetails? = null,
    val template: Template<ClientTemplateFieldStructure>? = null, // Link to which template was used for client structure
    var attributes: Map<String, Any> = emptyMap(), // E.g., {"industry": "Healthcare", "size": "50-100"}
)

data class ContactDetails(
    var email: String? = null,
    var phone: String? = null,
    var address: Address? = null,
    var additionalContacts: Map<String, String> = emptyMap() // E.g., {"billing_email": "..."}
)