package okare.core.models.user

import okare.core.entity.user.UserEntity
import okare.core.models.invoice.ChargeRate
import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var phone: String,
    var name: String,
    var company: String,
    var chargeRate: ChargeRate,
    var paymentDetails: UserEntity.Payment? = null
) {
    companion object Factory {
        fun fromEntity(entity: UserEntity): User {
            return User(
                id = entity.id ?: UUID.randomUUID(),
                email = entity.email,
                phone = entity.phone,
                name = entity.name,
                company = entity.company,
                chargeRate = entity.chargeRate,
                paymentDetails = entity.paymentDetails
            )
        }

        fun toEntity(user: User): UserEntity {
            return UserEntity(
                id = user.id,
                email = user.email,
                phone = user.phone,
                name = user.name,
                company = user.company,
                chargeRate = user.chargeRate,
                paymentDetails = user.paymentDetails
            )
        }
    }
}