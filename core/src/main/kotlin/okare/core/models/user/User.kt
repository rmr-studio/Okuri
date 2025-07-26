package okare.core.models.user

import okare.core.models.organisation.Organisation
import okare.core.models.organisation.OrganisationMember
import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var name: String,
    var phone: String? = null,
    var avatarUrl: String? = null,
    val memberships: List<OrganisationMember> = listOf(),
    var defaultOrganisation: Organisation? = null
)



