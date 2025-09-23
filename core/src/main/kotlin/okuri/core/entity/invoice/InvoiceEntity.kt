package okuri.core.entity.invoice

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.client.ClientEntity
import okuri.core.entity.client.toModel
import okuri.core.entity.organisation.OrganisationEntity
import okuri.core.entity.organisation.toModel
import okuri.core.entity.template.TemplateEntity
import okuri.core.entity.util.AuditableEntity
import okuri.core.enums.invoice.InvoiceStatus
import okuri.core.models.invoice.Billable
import okuri.core.models.invoice.Invoice
import okuri.core.models.invoice.InvoiceDates
import okuri.core.models.template.invoice.InvoiceTemplateFieldStructure
import okuri.core.models.template.report.ReportTemplateFieldStructure
import okuri.core.models.template.toModel
import org.hibernate.annotations.Type
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "invoice",
    uniqueConstraints = [UniqueConstraint(
        name = "uq_invoice_number_user",
        columnNames = ["organisation_id", "invoice_number"]
    )],
    indexes = [
        Index(name = "idx_invoice_organisation_id", columnList = "organisation_id"),
        Index(name = "idx_invoice_client_id", columnList = "client_id"),
    ],
)
data class InvoiceEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @JoinColumn(name = "organisation_id", nullable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    val organisation: OrganisationEntity,

    @JoinColumn(name = "client_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    val client: ClientEntity,

    @Column(name = "invoice_number", nullable = false, unique = true, columnDefinition = "integer")
    var invoiceNumber: String,

    @Type(JsonBinaryType::class)
    @Column(name = "billable_work", columnDefinition = "jsonb", nullable = false)
    var items: List<Billable>,

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    var amount: BigDecimal,

    @JoinColumn(name = "invoice_template_id", nullable = true)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    val invoiceTemplate: TemplateEntity<InvoiceTemplateFieldStructure>? = null,

    @JoinColumn(name = "report_template_id", nullable = true)
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    var reportTemplate: TemplateEntity<ReportTemplateFieldStructure>? = null,

    @Column(name = "custom_fields", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    var customFields: Map<String, Any> = emptyMap(), // JSONB for custom data

    @Column(name = "currency", nullable = false)
    var currency: Currency,

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    var status: InvoiceStatus = InvoiceStatus.PENDING,

    @Column(name = "invoice_start_date", nullable = true)
    var startDate: ZonedDateTime? = null,

    @Column(name = "invoice_end_date", nullable = true)
    var endDate: ZonedDateTime? = null,

    @Column(name = "invoice_issue_date", nullable = false)
    var issueDate: ZonedDateTime,

    @Column(name = "invoice_due_date", nullable = true)
    var dueDate: ZonedDateTime? = null,
) : AuditableEntity()

/**
 * Converts this persistent InvoiceEntity into its domain model representation (Invoice).
 *
 * The resulting Invoice contains mapped organisation and client models, optional invoice/report templates,
 * invoice line items, monetary and status fields, and invoice-related dates (including audit timestamps).
 *
 * @return the domain Invoice corresponding to this entity.
 * @throws IllegalArgumentException if the entity's `id` is null.
 */
fun InvoiceEntity.toModel(): Invoice {
    return this.id.let {
        if (it == null) {
            throw IllegalArgumentException("InvoiceEntity id cannot be null")
        }

        Invoice(
            id = it,
            organisation = this.organisation.toModel(includeMetadata = false),
            client = this.client.toModel(),
            invoiceNumber = this.invoiceNumber,
            items = this.items,
            amount = this.amount,
            currency = this.currency,
            status = this.status,
            template = this.invoiceTemplate?.toModel(),
            reportTemplate = this.reportTemplate?.toModel(),
            dates = InvoiceDates(
                startDate = this.startDate,
                endDate = this.endDate,
                issueDate = this.issueDate,
                dueDate = this.dueDate,
                invoiceCreatedAt = this.createdAt,
                invoiceUpdatedAt = this.updatedAt
            ),
        )
    }
}