package okuri.core.entity.block

import jakarta.persistence.*
import java.util.*

/**
 * Entity representing a direct relationship between a parent block. And an embedded child block.
 * This allows a block to contain other blocks as children in a structured manner.
 */
@Entity
@Table(
    name = "block_children",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["child_id"])
    ]
)
data class BlockChildEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    // The originator block that is referencing another data source
    @Column(name = "parent_id", nullable = false, columnDefinition = "uuid")
    val parentId: UUID,

    @Column(name = "child_id", nullable = false, columnDefinition = "uuid")
    val childId: UUID,

    @Column(name = "slot", nullable = false)
    val slot: String,

    @Column(name = "order_index", nullable = false)
    var orderIndex: Int
)
