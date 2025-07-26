package okare.core.models.organisation.request

data class OrganisationCreationRequest(
    val name: String,
    val avatarUrl: String? = null,
    val isDefault: Boolean = false
)