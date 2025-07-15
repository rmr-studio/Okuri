package okare.core.models.user

import okare.core.entity.user.UserEntity
import okare.core.models.invoice.ChargeRate
import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var name: String,
    var phone: String,
    var address: Address? = null,
    var company: Company? = null,
    var chargeRate: ChargeRate? = null,
    var paymentDetails: UserEntity.Payment? = null
)



