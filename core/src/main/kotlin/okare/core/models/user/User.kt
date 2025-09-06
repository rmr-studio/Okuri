package okare.core.models.user

import okare.core.models.organisation.MembershipDetails
import okare.core.models.organisation.Organisation
import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var name: String,
    var phone: String? = null,
    var avatarUrl: String? = null,
    val memberships: List<MembershipDetails> = listOf(),
    var defaultOrganisation: Organisation? = null
)



