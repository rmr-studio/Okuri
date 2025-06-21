package okare.core.entity.invoice

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "line_item",
    uniqueConstraints = [
        UniqueConstraint(name = "uq_line_item_name_user", columnNames = ["user_id", "name"])
    ],
    indexes = [
        Index(name = "idx_line_item_user_id", columnList = "user_id"),
    ]
)
data class LineItemEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "name", nullable = false)
    val name: String,

    @Column(name = "description", nullable = true)
    val description: String? = null,

    @Column(name = "charge_rate", nullable = false, precision = 19, scale = 4)
    val chargeRate: BigDecimal,

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