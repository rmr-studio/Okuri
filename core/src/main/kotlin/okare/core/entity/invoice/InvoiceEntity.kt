package okare.core.entity.invoice

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.invoice.Billable
import org.hibernate.annotations.Type
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "invoice",
    uniqueConstraints = [UniqueConstraint(
        name = "uq_invoice_number_user",
        columnNames = ["user_id", "invoice_number"]
    )],
    indexes = [
        Index(name = "idx_invoice_user_id", columnList = "user_id"),
        Index(name = "idx_invoice_client_id", columnList = "client_id"),
    ],
)
data class InvoiceEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "client_id", nullable = false)
    val clientId: UUID,

    @Column(name = "invoice_number", nullable = false, unique = true, columnDefinition = "integer")
    var invoiceNumber: Int,

    @Type(JsonBinaryType::class)
    @Column(name = "billable_work", columnDefinition = "jsonb", nullable = false)
    var items: List<Billable>,

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    var amount: BigDecimal,

    @Column(name = "currency", nullable = false)
    @Enumerated(EnumType.STRING)
    var currency: Currency,

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    var status: InvoiceStatus = InvoiceStatus.PENDING,

    @Column(name = "invoice_start_date", nullable = false)
    var startDate: ZonedDateTime,

    @Column(name = "invoice_end_date", nullable = false)
    var endDate: ZonedDateTime,

    @Column(name = "invoice_due_date", nullable = false)
    var dueDate: ZonedDateTime,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: ZonedDateTime = ZonedDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: ZonedDateTime = ZonedDateTime.now()
) {
    @PrePersist
    fun onPrePersist() {
        createdAt = ZonedDateTime.now()
        updatedAt = ZonedDateTime.now()
    }

    @PreUpdate
    fun onPreUpdate() {
        updatedAt = ZonedDateTime.now()
    }
}