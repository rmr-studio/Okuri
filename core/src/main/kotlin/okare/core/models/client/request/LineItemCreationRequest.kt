package okare.core.models.client.request

import java.math.BigDecimal

data class LineItemCreationRequest(
    val name: String,
    val description: String? = null,
    val chargeRate: BigDecimal
)