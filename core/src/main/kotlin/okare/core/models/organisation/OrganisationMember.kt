package okare.core.models.organisation


import okare.core.enums.organisation.OrganisationRoles
import okare.core.models.user.UserDisplay
import java.time.ZonedDateTime

data class OrganisationMember(
    val user: UserDisplay,
    val membershipDetails: MembershipDetails
)

data class MembershipDetails(
    // Optional, only included when a user is viewing their memberships. But not when viewing members of a given organisation
    val organisation: Organisation? = null,
    val role: OrganisationRoles,
    val memberSince: ZonedDateTime,
)