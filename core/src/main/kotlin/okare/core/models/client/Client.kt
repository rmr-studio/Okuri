package okare.core.models.client

import okare.core.models.common.Address
import okare.core.models.template.Template
import okare.core.models.template.client.ClientTemplateFieldStructure
import java.util.*

data class Client(
    val id: UUID,
    val organisationId: UUID,
    var name: String,
    var archived: Boolean = false,
    var contactDetails: ContactDetails? = null,
    val template: Template<ClientTemplateFieldStructure>? = null, // Link to which template was used for client structure
    var attributes: Map<String, Any>? = null
)

data class ContactDetails(
    var email: String? = null,
    var phone: String? = null,
    var address: Address? = null,
    var additionalContacts: Map<String, String>? = null
)