package okuri.core.entity.block


import jakarta.persistence.*
import okuri.core.entity.client.ClientEntity
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import okuri.core.models.block.BlockReference
import okuri.core.models.block.Referenceable
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id", nullable = false)
    val block: BlockEntity,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    val entityType: EntityType,

    @Column(name = "entity_id", nullable = false, columnDefinition = "uuid")
    val entityId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "ownership", nullable = false)
    val ownership: BlockOwnership = BlockOwnership.LINKED,

    @Column(name = "path", nullable = false)
    val path: String,

    @Column(name = "order_index")
    val orderIndex: Int? = null
) {
    /**
     * Convert BlockReferenceEntity to BlockReference model, given the associated entity
     * of type T has been fetched, and matches the associated entity type declared in entityType.
     */
    fun <T : Referenceable<E>, E : Any?> toModel(entity: T?): BlockReference<*> {
        val id = requireNotNull(this.id) { "BlockReferenceEntity ID cannot be null when converting to model" }
        val blockId = requireNotNull(this.block.id) { "Block ID cannot be null when converting to model" }

        if (entity == null) {
            return BlockReference(
                id = id,
                entityType = this.entityType,
                blockId = blockId,
                entityId = this.entityId,
                ownership = this.ownership,
                path = this.path,
                entity = null
            )
        }

        when (this.entityType) {
            EntityType.BLOCK -> {
                if (entity !is BlockEntity) {
                    throw IllegalArgumentException("Expected entity of type BlockEntity for EntityType.BLOCK")
                }
                // Convert to model
                return BlockReference(
                    id = id,
                    entityType = this.entityType,
                    entityId = this.entityId,
                    entity = entity.toReference(),
                    ownership = this.ownership,
                    path = this.path,
                    orderIndex = this.orderIndex,
                    blockId = blockId
                )
            }

            EntityType.CLIENT -> {
                if (entity !is ClientEntity) {
                    throw IllegalArgumentException("Expected entity of type ClientEntity for EntityType.CLIENT")
                }
                // Convert to model
                return BlockReference(
                    id = id,
                    entityType = this.entityType,
                    entityId = this.entityId,
                    entity = entity.toReference(),
                    ownership = this.ownership,
                    path = this.path,
                    orderIndex = this.orderIndex,
                    blockId = blockId
                )
            }

            // todo: Flesh out remaining entity types

            // Add other entity types here as needed
            else -> {
                throw IllegalArgumentException("Unsupported EntityType: ${this.entityType}")
            }
        }


    }

}


