package okuri.core.models.client

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.entity.util.AuditableModel
import okuri.core.enums.client.ClientType
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Referenceable
import okuri.core.models.common.Contact
import okuri.core.models.company.Company
import java.time.ZonedDateTime
import java.util.*

@JsonTypeName("client")
@Schema(requiredProperties = ["type", "id", "name", "organisationId"])
data class Client(
    override val type: EntityType = EntityType.CLIENT,
    val id: UUID,
    val organisationId: UUID,

    // Basic compulsory details
    val name: String,
    var contact: Contact,
    var clientType: ClientType? = null,
    // Optional company details for service/enterprise based clients
    var company: Company? = null,
    var role: String? = null,
    var archived: Boolean = false,
    
    // Auditing fields
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null,
) : AuditableModel(), Referenceable
