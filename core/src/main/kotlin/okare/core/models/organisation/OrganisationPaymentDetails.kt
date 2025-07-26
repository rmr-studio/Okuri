package okare.core.models.organisation

data class OrganisationPaymentDetails(
    var bsb: String,
    var accountNumber: String,
    var accountName: String
)