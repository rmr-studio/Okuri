package okare.core.entity.invoice

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.entity.client.ClientEntity
import okare.core.entity.client.toModel
import okare.core.entity.user.UserEntity
import okare.core.entity.user.toModel
import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.invoice.Billable
import okare.core.models.invoice.Invoice
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

    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    val user: UserEntity,

    @JoinColumn(name = "client_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    val client: ClientEntity,

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

fun InvoiceEntity.toModel(): Invoice {
    return this.id.let {
        if (it == null) {
            throw IllegalArgumentException("InvoiceEntity id cannot be null")
        }

        Invoice(
            id = it,
            user = this.user.toModel(),
            client = this.client.toModel(),
            invoiceNumber = this.invoiceNumber,
            items = this.items,
            amount = this.amount,
            currency = this.currency,
            status = this.status,
            startDate = this.startDate,
            endDate = this.endDate,
            dueDate = this.dueDate,
            createdAt = this.createdAt
        )
    }
}