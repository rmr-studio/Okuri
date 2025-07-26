package okare.core.models.organisation

import java.time.ZonedDateTime
import java.util.*

data class Organisation(
    val id: UUID,
    val name: String,
    val avatarUrl: String? = null,
    val businessNumber: String? = null,
    val taxId: String? = null,
    val address: OrganisationAddress? = null,
    val organisationPaymentDetails: OrganisationPaymentDetails? = null, // Optional, can be null if not applicable
    val customAttributes: Map<String, Any> = emptyMap(), // JSONB for industry-specific fields
    val memberCount: Int,
    val createdAt: ZonedDateTime,
    val members: List<OrganisationMember> = listOf(),
)