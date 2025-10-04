package okuri.core.models.client.request

import okuri.core.models.common.Contact
import java.util.*

data class ClientCreationRequest(
    val name: String,
    val organisationId: UUID,
    val companyId: UUID? = null,
    val companyRole: String? = null,
    val contact: Contact,
)

