package okare.core.models.invoice

import java.io.Serializable
import java.time.ZonedDateTime

data class Billable(
    val date: ZonedDateTime,
    val description: String,
    val lineItem: LineItem,
    val hours: Number,
) : Serializable