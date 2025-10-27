package okuri.core.models.client

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.entity.util.AuditableModel
import okuri.core.enums.client.ClientType
import okuri.core.enums.core.EntityType
import okuri.core.models.block.BlockTree
import okuri.core.models.block.Referenceable
import okuri.core.models.common.Contact
import okuri.core.models.company.Company
import java.time.ZonedDateTime
import java.util.*

@JsonTypeName("client")
@Schema(requiredProperties = ["kind", "id", "name", "organisationId"])
data class Client(
    override val kind: EntityType = EntityType.CLIENT,
    val id: UUID,
    val organisationId: UUID,
    val name: String,
    var contact: Contact,
    var type: ClientType? = null,
    // Optional company details for service/enterprise based clients
    var company: Company? = null,
    var role: String? = null,
    var archived: Boolean = false,
    var metadata: ClientTypeMetadata? = null,
    var attributes: Map<String, BlockTree>? = null,
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null,
) : AuditableModel(), Referenceable
