package okare.core.models.user

import okare.core.entity.user.UserEntity

data class PaymentDetails(
    var bsb: String,
    var accountNumber: String,
    var accountName: String
) {
    companion object Factory {
        fun fromEntity(entity: UserEntity.Payment): PaymentDetails {
            return PaymentDetails(
                bsb = entity.bsb,
                accountNumber = entity.accountNumber,
                accountName = entity.accountName
            )
        }

        fun toEntity(paymentDetails: PaymentDetails): UserEntity.Payment {
            return UserEntity.Payment(
                bsb = paymentDetails.bsb,
                accountNumber = paymentDetails.accountNumber,
                accountName = paymentDetails.accountName
            )
        }
    }
}