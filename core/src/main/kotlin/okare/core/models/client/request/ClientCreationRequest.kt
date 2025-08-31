package okare.core.models.client.request

import okare.core.models.client.ContactDetails
import okare.core.models.template.Template
import okare.core.models.template.client.ClientTemplateFieldStructure
import java.util.*

data class ClientCreationRequest(
    val name: String,
    val organisationId: UUID,
    val contact: ContactDetails? = null,
    val attributes: Map<String, Any> = emptyMap(), // E.g., {"industry": "Healthcare", "size": "50-100"}
    // If a template was used during creation, this will be set to link the client to that template structure
    val template: Template<ClientTemplateFieldStructure>? = null
)

