package okare.core.models.client

import okare.core.models.user.Address
import java.util.*

data class Client(
    val id: UUID,
    val userId: UUID,
    var name: String,
    var address: Address,
    var ndisNumber: String,
    var phone: String
)