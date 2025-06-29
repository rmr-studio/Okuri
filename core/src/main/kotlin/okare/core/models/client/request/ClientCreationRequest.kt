package okare.core.models.client.request

import okare.core.models.user.Address

data class ClientCreationRequest(
    val name: String,
    val address: Address,
    val ndisNumber: String,
    val phone: String
)