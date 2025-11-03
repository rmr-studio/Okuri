package okuri.core.entity.block

import jakarta.persistence.*
import java.util.*

/**
 * Entity representing a direct relationship between a parent block and an embedded child block.
 * This allows a block to contain other blocks as children in a structured manner.
 */
@Entity
@Table(
    name = "block_children",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["child_id"]),
        UniqueConstraint(columnNames = ["parent_id", "order_index"])
    ],
    indexes = [
        Index(name = "idx_block_children_parent_id", columnList = "parent_id"),
        Index(name = "idx_block_children_child_id", columnList = "child_id"),
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


    @Column(name = "order_index", nullable = false)
    var orderIndex: Int
)
