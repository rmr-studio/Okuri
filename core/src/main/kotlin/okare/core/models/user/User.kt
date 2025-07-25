package okare.core.models.user

import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var name: String,
    var phone: String,
    var address: Address? = null,
    var company: Company? = null,
)



