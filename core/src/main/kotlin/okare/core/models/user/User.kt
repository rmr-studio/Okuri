package okare.core.models.user

import okare.core.entity.user.UserEntity
import okare.core.models.invoice.ChargeRate
import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var name: String,
    var phone: String,
    var address: Address,
    var company: Company,
    var chargeRate: ChargeRate,
    var paymentDetails: UserEntity.Payment? = null
)