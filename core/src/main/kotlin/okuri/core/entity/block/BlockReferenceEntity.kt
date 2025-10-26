package okuri.core.entity.block


import jakarta.persistence.*
import okuri.core.enums.core.EntityType
import java.util.*

/**
 * Entity representing a reference from a Block to another entity in the system.
 * This allows a block to reference and display information from
 *  - Other Blocks
 *  - Other Entities (e.g., Clients, Projects, etc.)
 */
@Entity
@Table(
    name = "block_references",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["block_id", "entity_type", "entity_id", "path"])
    ]
)
data class BlockReferenceEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    // The originator block that is referencing another data source
    @Column(name = "block_id", nullable = false, columnDefinition = "uuid")
    val parentId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    val entityType: EntityType,

    @Column(name = "entity_id", nullable = false, columnDefinition = "uuid")
    val entityId: UUID,

    @Column(name = "path", nullable = false)
    val path: String,

    @Column(name = "order_index")
    var orderIndex: Int? = null
)

