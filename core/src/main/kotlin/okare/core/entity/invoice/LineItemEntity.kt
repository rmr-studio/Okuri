package okare.core.entity.invoice

import jakarta.persistence.*
import java.util.*

@Entity
@Table(
    name = "line_item",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "name"])],
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

    @Column(name = "charge_rate", nullable = false)
    val chargeRate: Double,
)