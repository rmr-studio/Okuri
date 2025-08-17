package okare.core.models.invoice.request

import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.invoice.Billable
import okare.core.models.template.Template
import okare.core.models.template.invoice.InvoiceTemplateFieldStructure
import okare.core.models.template.report.ReportTemplateFieldStructure
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

data class InvoiceCreationRequest(
    val clientId: UUID,
    val organisationId: UUID,
    val template: Template<InvoiceTemplateFieldStructure>,
    // Report template for generating the invoice report, ie. Format of sent invoice
    var reportTemplate: Template<ReportTemplateFieldStructure>? = null,
    val invoiceNumber: String,
    val items: List<Billable>,
    val amount: BigDecimal,
    val currency: Currency,
    val status: InvoiceStatus,
    val startDate: ZonedDateTime? = null,
    val endDate: ZonedDateTime? = null,
    val dueDate: ZonedDateTime? = null,
    val issueDate: ZonedDateTime,
    val customFields: Map<String, Any> = emptyMap() // JSONB for custom data

)