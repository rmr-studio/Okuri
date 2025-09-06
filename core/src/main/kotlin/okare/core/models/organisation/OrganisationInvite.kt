package okare.core.models.organisation

import okare.core.enums.organisation.OrganisationInviteStatus
import okare.core.enums.organisation.OrganisationRoles
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
