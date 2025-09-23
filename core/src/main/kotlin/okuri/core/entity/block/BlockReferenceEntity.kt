package okuri.core.entity.block


import jakarta.persistence.*
import okuri.core.entity.client.toModel
import okuri.core.enums.core.EntityType
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

    // The originator block that is referencing another data source
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id", nullable = false)
    val block: BlockEntity,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    val entityType: EntityType,

    @Column(name = "entity_id", nullable = false, columnDefinition = "uuid")
    val entityId: UUID
)

/**
 * Convert BlockReferenceEntity to BlockReference model, given the associated entity
 * of type T has been fetched, and matches the associated entity type declared in entityType.
 */
fun <T> BlockReferenceEntity.toModel(entity: T?) {
    if (entity == null) {
        throw IllegalArgumentException("Associated entity must be provided to convert BlockReferenceEntity to model")
    }

    when (this.entityType) {
        EntityType.BLOCK -> {
            if (entity !is BlockEntity) {
                throw IllegalArgumentException("Expected entity of type BlockEntity for EntityType.BLOCK")
            }
            // Convert to model
            okuri.core.models.block.BlockReference(
                id = this.id!!,
                block = this.block.toModel(),
                entityType = this.entityType,
                entityId = this.entityId,
                entity = entity.toModel()
            )
        }

        EntityType.CLIENT -> {
            if (entity !is okuri.core.entity.client.ClientEntity) {
                throw IllegalArgumentException("Expected entity of type ClientEntity for EntityType.CLIENT")
            }
            // Convert to model
            okuri.core.models.block.BlockReference(
                id = this.id!!,
                block = this.block.toModel(),
                entityType = this.entityType,
                entityId = this.entityId,
                entity = entity.toModel()
            )
        }

        // todo: Flesh out remaining entity types

        // Add other entity types here as needed
        else -> {
            throw IllegalArgumentException("Unsupported EntityType: ${this.entityType}")
        }
    }


}

