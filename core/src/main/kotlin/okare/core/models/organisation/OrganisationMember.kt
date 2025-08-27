package okare.core.models.organisation


import okare.core.enums.organisation.OrganisationRoles
import okare.core.models.user.UserDisplay
import java.time.ZonedDateTime
import java.util.*

data class OrganisationMember(
    val user: UserDisplay,
    val membershipDetails: MembershipDetails
)

data class MembershipDetails(
    val organisationId: UUID,
    val role: OrganisationRoles,
    val memberSince: ZonedDateTime,
)