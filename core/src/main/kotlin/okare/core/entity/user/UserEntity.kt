package okare.core.entity.user

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.models.invoice.ChargeRate
import okare.core.models.user.Address
import okare.core.models.user.Company
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

    @Column(name = "display_name", nullable = false)
    var name: String,

    @Column(name = "email", nullable = false)
    var email: String,

    @Column(name = "phone", nullable = false)
    var phone: String,

    @Type(JsonBinaryType::class)
    @Column(name = "address", nullable = false, columnDefinition = "jsonb")
    var address: Address,

    @Type(JsonBinaryType::class)
    @Column(name = "company", nullable = false, columnDefinition = "jsonb")
    var company: Company,

    @Type(JsonBinaryType::class)
    @Column(name = "charge_rate", columnDefinition = "jsonb")
    var chargeRate: ChargeRate,

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