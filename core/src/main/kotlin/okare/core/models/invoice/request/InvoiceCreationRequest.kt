package okare.core.models.invoice.request

import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.client.Client
import okare.core.models.invoice.Billable
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

data class InvoiceCreationRequest(
    val client: Client,
    val invoiceNumber: String,
    val items: List<Billable>,
    val amount: BigDecimal,
    val currency: Currency,
    val status: InvoiceStatus,
    val startDate: ZonedDateTime,
    val endDate: ZonedDateTime,
    val dueDate: ZonedDateTime,
)