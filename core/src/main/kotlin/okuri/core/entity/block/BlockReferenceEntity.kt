package okuri.core.entity.block


import jakarta.persistence.*
import java.util.*

@Entity
@Table(
    name = "block_references",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["block_id", "entity_type", "entity_id"])
    ]
)
data class BlockReferenceEntity(
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id", nullable = false)
    val block: BlockEntity,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    val entityType: EntityType,

    @Column(name = "entity_id", nullable = false, columnDefinition = "uuid")
    val entityId: UUID
)

enum class EntityType {
    LINE_ITEM,
    CLIENT,
    INVOICE,
    BLOCK,
    REPORT,
    DOCUMENT,
    PROJECT
}
