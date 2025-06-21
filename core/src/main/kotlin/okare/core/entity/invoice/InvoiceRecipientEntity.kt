package okare.core.entity.invoice

import jakarta.persistence.*
import java.util.*

@Entity
@Table(
    name = "invoice_recipient",
)
data class InvoiceRecipientEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "name", nullable = false)
    val name: String,

    @Column(name = "address", nullable = false)
    val address: String,

    @Column(name = "phone", nullable = false)
    val phone: String,
)