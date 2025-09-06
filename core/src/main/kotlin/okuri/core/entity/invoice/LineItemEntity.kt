package okuri.core.entity.invoice

import jakarta.persistence.*
import okuri.core.models.invoice.LineItem
import okuri.core.models.invoice.LineItemType
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "line_item",
    uniqueConstraints = [
        UniqueConstraint(name = "uq_line_item_name_organisation", columnNames = ["organisation_id", "name"])
    ],
    indexes = [
        Index(name = "idx_line_item_organisation_id", columnList = "organisation_id"),
    ]
)
data class LineItemEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "description", nullable = true)
    var description: String? = null,

    @Column(name = "charge_rate", nullable = false, precision = 19, scale = 4)
    var chargeRate: BigDecimal,

    @Column(name = "type", nullable = false)
    var type: LineItemType = LineItemType.SERVICE,

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

fun LineItemEntity.toModel(): LineItem {
    this.id.let {
        if (it == null) {
            throw IllegalArgumentException("LineItemEntity id cannot be null")
        }
        return LineItem(
            id = it,
            organisationId = this.organisationId,
            description = this.description,
            name = this.name,
            chargeRate = this.chargeRate,
            type = this.type
        )
    }
}