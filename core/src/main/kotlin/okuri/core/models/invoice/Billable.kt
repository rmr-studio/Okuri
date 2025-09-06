package okuri.core.models.invoice

import java.io.Serializable
import java.time.ZonedDateTime

data class Billable(
    val date: ZonedDateTime,
    val description: String,
    val lineItem: LineItem,
    val billableType: BillableType,
    val quantity: Number,
) : Serializable

enum class BillableType {
    HOURS, DISTANCE, QUANTITY, FIXED
}