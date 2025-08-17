package okare.core.models.client.request

import okare.core.models.client.ContactDetails
import java.util.*

data class ClientCreationRequest(
    val name: String,
    val organisationId: UUID,
    val contact: ContactDetails? = null,
    val attributes: Map<String, Any> = emptyMap() // E.g., {"industry": "Healthcare", "size": "50-100"}
)

