package okare.core.models.invoice


import okare.core.enums.invoice.InvoiceStatus
import org.springframework.security.core.userdetails.User
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

data class Invoice(
    val id: UUID,
    val user: User,
    val recipient: Recipient,
    val invoiceNumber: String,
    val items: List<Billable>,
    val amount: BigDecimal,
    val currency: Currency,
    val status: InvoiceStatus,
    val startDate: ZonedDateTime,
    val endDate: ZonedDateTime,
    val dueDate: ZonedDateTime,
    val createdAt: ZonedDateTime
)