package okuri.core.models.client

import okuri.core.models.common.Company
import okuri.core.models.common.Contact
import org.springframework.cglib.core.Block
import java.util.*

data class Client(
    val id: UUID,
    val organisationId: UUID,
    val name: String,
    var contact: Contact,
    // Optional company details for service/enterprise based clients
    var company: Company? = null,
    var role: String? = null,
    var archived: Boolean = false,
    var metadata: ClientTypeMetadata? = null,
    var attributes: Map<String, Block>? = null
)
