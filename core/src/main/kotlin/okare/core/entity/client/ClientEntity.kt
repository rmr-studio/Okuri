package okare.core.entity.client

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.models.user.Address
import org.hibernate.annotations.Type
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "client",
    uniqueConstraints = [
        UniqueConstraint(name = "uq_client_phone_user", columnNames = ["user_id", "phone"]),
        UniqueConstraint(name = "uq_client_ndis_user", columnNames = ["user_id", "ndis_number"])
    ],
    indexes = [
        Index(name = "idx_client_user_id", columnList = "user_id")
    ]
)
data class ClientEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "name", nullable = false)
    var name: String,

    @Type(JsonBinaryType::class)
    @Column(name = "address", nullable = false, columnDefinition = "jsonb")
    var address: Address,

    @Column(name = "phone", nullable = false)
    var phone: String,

    @Column(name = "ndis_number", nullable = false)
    var NDISnumber: String,

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
}