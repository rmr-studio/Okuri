package okuri.core.models.invoice


import okuri.core.enums.invoice.InvoiceStatus
import okuri.core.models.client.Client
import okuri.core.models.organisation.Organisation
import okuri.core.models.template.Template
import okuri.core.models.template.invoice.InvoiceTemplateFieldStructure
import okuri.core.models.template.report.ReportTemplateFieldStructure
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

data class Invoice(
    val id: UUID,
    val organisation: Organisation,
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
