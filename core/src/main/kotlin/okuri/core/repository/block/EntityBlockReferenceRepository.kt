package okuri.core.repository.block

import okuri.core.entity.block.EntityBlocksReferenceEntity
import okuri.core.enums.core.EntityType
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface EntityBlockReferenceRepository : JpaRepository<EntityBlocksReferenceEntity, UUID> {
    /**
 * Finds all block reference entities for a given entity identifier and type.
 *
 * @param entityId The UUID of the entity to filter by.
 * @param entityType The type of the entity to filter by.
 * @return A list of EntityBlocksReferenceEntity instances that match the provided `entityId` and `entityType`.
 */
fun findByEntityIdAndEntityType(entityId: UUID, entityType: EntityType): List<EntityBlocksReferenceEntity>
}