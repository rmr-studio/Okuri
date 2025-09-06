package okuri.core.models.organisation

import okuri.core.enums.organisation.OrganisationInviteStatus
import okuri.core.enums.organisation.OrganisationRoles
import java.time.ZonedDateTime
import java.util.*

data class OrganisationInvite(
    val id: UUID,
    val organisationId: UUID,
    val email: String,
    val inviteToken: String,
    val invitedBy: UUID? = null,
    val createdAt: ZonedDateTime,
    val expiresAt: ZonedDateTime,
    val role: OrganisationRoles,
    val status: OrganisationInviteStatus
)
