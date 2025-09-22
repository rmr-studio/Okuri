package okuri.core.models.client

import okuri.core.models.common.Contact
import okuri.core.models.template.Template
import okuri.core.models.template.client.ClientTemplateFieldStructure
import java.util.*

data class Client(
    val id: UUID,
    val organisationId: UUID,
    var name: String,
    var contactDetails: Contact,
    var archived: Boolean = false,
    val template: Template<ClientTemplateFieldStructure>? = null, // Link to which template was used for client structure
    var attributes: Map<String, Any>? = null
)
