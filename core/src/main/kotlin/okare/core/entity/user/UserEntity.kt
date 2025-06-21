package okare.core.entity.user

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.models.invoice.ChargeRate
import org.hibernate.annotations.Type
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "users",
)
data class UserEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "email", nullable = false)
    var email: String,

    @Column(name = "phone", nullable = false)
    var phone: String,

    @Column(name = "display_name", nullable = false)
    var name: String,

    @Column(name = "company_name", nullable = false)
    var company: String,

    @Type(JsonBinaryType::class)
    @Column(name = "charge_rate", columnDefinition = "jsonb")
    val chargeRate: ChargeRate,

    @Embedded
    var paymentDetails: Payment? = null,

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    ) var createdAt: ZonedDateTime = ZonedDateTime.now(),

    @Column(name = "updated_at", nullable = false) var updatedAt: ZonedDateTime = ZonedDateTime.now()
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

    @Embeddable
    data class Payment(
        @Column(name = "bsb")
        var bsb: String,

        @Column(name = "account_number")
        var accountNumber: String,

        @Column(name = "account_name")
        var accountName: String
    )
}