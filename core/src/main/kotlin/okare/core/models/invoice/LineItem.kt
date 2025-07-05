package okare.core.models.invoice

import java.math.BigDecimal
import java.util.*

data class LineItem(
    val id: UUID,
    val name: String,
    val userId: UUID,
    val description: String? = null,
    val chargeRate: BigDecimal,
)