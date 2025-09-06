package okuri.core.models.client.request

import java.math.BigDecimal
import java.util.*

data class LineItemCreationRequest(
    val name: String,
    val organisationId: UUID,
    val description: String? = null,
    val chargeRate: BigDecimal
)