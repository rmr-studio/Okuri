package okare.core.models.invoice


import okare.core.entity.invoice.InvoiceEntity
import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.client.Client
import okare.core.models.user.User
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

data class Invoice(
    val id: UUID,
    val user: User,
    val client: Client,
    val invoiceNumber: String,
    val items: List<Billable>,
    val amount: BigDecimal,
    val currency: Currency,
    val status: InvoiceStatus,
    val startDate: ZonedDateTime,
    val endDate: ZonedDateTime,
    val dueDate: ZonedDateTime,
    val createdAt: ZonedDateTime
) {
    companion object Factory {
        fun fromEntity(entity: InvoiceEntity): Invoice {
            entity.id.let {
                if (it == null) {
                    throw IllegalArgumentException("InvoiceEntity id cannot be null")
                }

                return Invoice(
                    id = entity.id ?: throw IllegalArgumentException("InvoiceEntity id cannot be null"),
                    user = User.fromEntity(entity.user),
                    client = Client.fromEntity(entity.client),
                    invoiceNumber = entity.invoiceNumber,
                    items = entity.items,
                    amount = entity.amount,
                    currency = entity.currency,
                    status = entity.status,
                    startDate = entity.startDate,
                    endDate = entity.endDate,
                    dueDate = entity.dueDate,
                    createdAt = entity.createdAt
                )
            }
        }
    }
}