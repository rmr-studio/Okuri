package okare.core.models.organisation

data class OrganisationAddress(
    val street: String,
    val city: String,
    val state: String,
    val postalCode: String,
    val country: String
)