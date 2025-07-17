package okare.core.models.invoice


import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.client.Client
import okare.core.models.template.Template
import okare.core.models.template.invoice.InvoiceTemplateFieldStructure
import okare.core.models.template.report.ReportTemplateFieldStructure
import okare.core.models.user.User
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

data class Invoice(
    val id: UUID,
    val user: User,
    val client: Client,
    // Invoice for the specific billing structure (Ie. Tables for distance, tables for quantity of products, etc.)
    val template: Template<InvoiceTemplateFieldStructure>? = null,
    // Report template for generating the invoice report, ie. Format of sent invoice
    var reportTemplate: Template<ReportTemplateFieldStructure>? = null,
    val invoiceNumber: String, // Changed to String for flexible formats (e.g., "INV-001")
    val items: List<Billable>,
    val amount: BigDecimal,
    var currency: Currency,
    var status: InvoiceStatus,
    val dates: InvoiceDates,
    var customFields: Map<String, Any> = emptyMap() // JSONB for custom data
)

data class InvoiceDates(
    var startDate: ZonedDateTime? = null,
    var endDate: ZonedDateTime? = null,
    var issueDate: ZonedDateTime,
    var dueDate: ZonedDateTime? = null,
    val invoiceCreatedAt: ZonedDateTime,
    val invoiceUpdatedAt: ZonedDateTime
)
