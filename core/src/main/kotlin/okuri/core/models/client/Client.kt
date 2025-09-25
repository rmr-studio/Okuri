package okuri.core.models.client

import okuri.core.entity.util.AuditableModel
import okuri.core.models.common.Company
import okuri.core.models.common.Contact
import org.springframework.cglib.core.Block
import java.time.ZonedDateTime
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
    var attributes: Map<String, Block>? = null,
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null,
) : AuditableModel()
