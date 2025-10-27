package okuri.core.models.organisation

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.core.EntityType
import okuri.core.enums.organisation.OrganisationPlan
import okuri.core.models.block.Referenceable
import okuri.core.models.common.Address
import java.time.ZonedDateTime
import java.util.*

@JsonTypeName("organisation")
@Schema(requiredProperties = ["kind", "id", "name"])
data class Organisation(
    override val kind: EntityType = EntityType.ORGANISATION,
    val id: UUID,
    var name: String,
    val plan: OrganisationPlan,
    var defaultCurrency: Currency = Currency.getInstance("AUD"), // Default currency for the organisation
    var avatarUrl: String? = null,
    var businessNumber: String? = null,
    var taxId: String? = null,
    var address: Address? = null,
    var organisationPaymentDetails: OrganisationPaymentDetails? = null, // Optional, can be null if not applicabl
    val memberCount: Int,
    val createdAt: ZonedDateTime?,
    val members: List<OrganisationMember> = listOf(),
    val invites: List<OrganisationInvite> = listOf()
) : Referenceable
