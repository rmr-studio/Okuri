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
) {
    companion object Factory {
        fun fromEntity(entity: UserEntity): User {
            entity.id.let {
                if (it == null) {
                    throw IllegalArgumentException("UserEntity id cannot be null")
                }
                return User(
                    id = it,
                    email = entity.email,
                    phone = entity.phone,
                    name = entity.name,
                    company = entity.company,
                    chargeRate = entity.chargeRate,
                    paymentDetails = entity.paymentDetails,
                    address = entity.address,
                )
            }
        }
    }
}