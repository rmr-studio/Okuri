package okare.core.models.user

data class PaymentDetails(
    var bsb: String,
    var accountNumber: String,
    var accountName: String
)