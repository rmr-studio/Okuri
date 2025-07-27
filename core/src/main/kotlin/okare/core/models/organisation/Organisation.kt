package okare.core.models.organisation

import okare.core.models.common.Address
import java.time.ZonedDateTime
import java.util.*

data class Organisation(
    val id: UUID,
    var name: String,
    var avatarUrl: String? = null,
    var businessNumber: String? = null,
    var taxId: String? = null,
    var address: Address? = null,
    var organisationPaymentDetails: OrganisationPaymentDetails? = null, // Optional, can be null if not applicable
    var customAttributes: Map<String, Any> = emptyMap(), // JSONB for industry-specific fields
    val memberCount: Int,
    val createdAt: ZonedDateTime,
    val members: List<OrganisationMember> = listOf(),
)