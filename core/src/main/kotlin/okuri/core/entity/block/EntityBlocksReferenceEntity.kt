package okuri.core.entity.block

import jakarta.persistence.*
import okuri.core.enums.core.EntityType
import java.util.*

/**
 * Entity representing a reference to the blocks associated with an entity.
 * This allows an entity (ie. Client, Project, etc.) to reference its associated blocks.
 *  - This will hold all reference id to the parent layer blocks.
 *  - These can then be fetched to locate all referenced children, and reconstruct the full tree structure.
 */
@Entity
@Table(
    name = "entity_blocks",
    uniqueConstraints = [UniqueConstraint(columnNames = ["entity_id", "entity_type", "key"])]
)
data class EntityBlocksReferenceEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "entity_id", nullable = false, columnDefinition = "uuid")
    val entityId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    val entityType: EntityType,

    // Optional key to identify different block references for the same entity, should be mandatory in global scopes
    @Column(name = "key", nullable = true)
    val key: String?,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id", nullable = false)
    val block: BlockEntity,
)