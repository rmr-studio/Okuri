package okare.core.models.organisation.request

import okare.core.enums.organisation.OrganisationPlan
import okare.core.models.common.Address
import okare.core.models.organisation.OrganisationPaymentDetails

data class OrganisationCreationRequest(
    val name: String,
    val avatarUrl: String? = null,
    val plan: OrganisationPlan,
    val defaultCurrency: String, // Default currency for the organisation, can be a string representation of the currency code
    val isDefault: Boolean = false,
    val businessNumber: String? = null,
    val taxId: String? = null,
    val address: Address,
    val payment: OrganisationPaymentDetails? = null, // Optional, can be null if not applicable
    val customAttributes: Map<String, Any> = emptyMap() // JSONB for industry-specific fields`
)