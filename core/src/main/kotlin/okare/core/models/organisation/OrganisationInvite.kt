package okare.core.models.organisation

import okare.core.entity.organisation.OrganisationInviteEntity
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
) {
    companion object Factory {
        fun fromEntity(entity: OrganisationInviteEntity): OrganisationInvite {
            return entity.id.let {
                if (it == null) {
                    throw IllegalArgumentException("OrganisationInviteEntity must have a non-null id")
                }
                OrganisationInvite(
                    id = it,
                    organisationId = entity.organisationId,
                    email = entity.email,
                    inviteToken = entity.token,
                    invitedBy = entity.invitedBy,
                    createdAt = entity.createdAt,
                    expiresAt = entity.expiresAt,
                    role = entity.role,
                    status = entity.inviteStatus
                )
            }
        }
    }
}