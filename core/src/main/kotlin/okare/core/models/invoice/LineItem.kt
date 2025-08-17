package okare.core.models.invoice

import java.math.BigDecimal
import java.util.*

data class LineItem(
    val id: UUID,
    val name: String,
    val organisationId: UUID,
    val description: String? = null,
    val type: LineItemType,
    val chargeRate: BigDecimal,
)

enum class LineItemType {
    SERVICE, PRODUCT, FEE, DISCOUNT
}