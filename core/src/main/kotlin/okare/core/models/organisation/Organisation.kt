package okare.core.models.organisation

import okare.core.enums.organisation.OrganisationPlan
import okare.core.models.common.Address
import java.time.ZonedDateTime
import java.util.*

data class Organisation(
    val id: UUID,
    var name: String,
    val plan: OrganisationPlan,
    var defaultCurrency: Currency = Currency.getInstance("AUD"), // Default currency for the organisation
    var avatarUrl: String? = null,
    var businessNumber: String? = null,
    var taxId: String? = null,
    var address: Address? = null,
    var organisationPaymentDetails: OrganisationPaymentDetails? = null, // Optional, can be null if not applicable
    var customAttributes: Map<String, Any> = emptyMap(), // JSONB for industry-specific fields
    var tileLayout: Map<String, Any>? = null, // JSONB for custom tile layout configuration
    val memberCount: Int,
    val createdAt: ZonedDateTime,
    val members: List<OrganisationMember> = listOf(),
    val invites: List<OrganisationInvite> = listOf()
)
