package okare.core.models.invoice

import okare.core.entity.invoice.LineItemEntity
import java.math.BigDecimal
import java.util.*

data class LineItem(
    val id: UUID,
    val name: String,
    val description: String? = null,
    val chargeRate: BigDecimal,
) {

    companion object Factory {
        fun fromEntity(entity: LineItemEntity): LineItem {
            return LineItem(
                id = entity.id ?: UUID.randomUUID(),
                name = entity.name,
                description = entity.description,
                chargeRate = entity.chargeRate
            )
        }
    }
}