package okare.core.entity.invoice

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.entity.client.ClientEntity
import okare.core.entity.user.UserEntity
import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.invoice.Billable
import org.hibernate.annotations.Type
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "invoice",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "invoice_number"])],
)
data class InvoiceEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, insertable = true, updatable = true)
    val user: UserEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "client_id",
        referencedColumnName = "id",
        nullable = false,
        insertable = true,
        updatable = true
    )
    val recipient: ClientEntity,

    @Column(name = "invoice_number", nullable = false, unique = true)
    var invoiceNumber: String,

    @Type(JsonBinaryType::class)
    @Column(name = "billable_work", columnDefinition = "jsonb", nullable = false)
    val items: List<Billable>,

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    val amount: BigDecimal,

    @Column(name = "currency", nullable = false)
    @Enumerated(EnumType.STRING)
    val currency: Currency,

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    var status: InvoiceStatus = InvoiceStatus.PENDING,

    @Column(name = "invoice_start_date", nullable = false)
    val startDate: ZonedDateTime,

    @Column(name = "invoice_end_date", nullable = false)
    val endDate: ZonedDateTime,

    @Column(name = "invoice_due_date", nullable = false)
    val dueDate: ZonedDateTime,

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