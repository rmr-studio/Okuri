package okare.core.models.organisation

data class OrganisationPaymentDetails(
    var bsb: String? = null,
    var accountNumber: String? = null,
    var accountName: String? = null
)