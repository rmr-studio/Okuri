package okuri.core.models.client.request

import okuri.core.models.common.Contact
import okuri.core.models.template.Template
import okuri.core.models.template.client.ClientTemplateFieldStructure
import java.util.*

data class ClientCreationRequest(
    val name: String,
    val organisationId: UUID,
    val contact: Contact,
    val attributes: Map<String, Any> = emptyMap(), // E.g., {"industry": "Healthcare", "size": "50-100"}
    // If a template was used during creation, this will be set to link the client to that template structure
    val template: Template<ClientTemplateFieldStructure>? = null
)

