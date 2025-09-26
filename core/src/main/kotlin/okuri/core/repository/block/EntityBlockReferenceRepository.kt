package okuri.core.repository.block

import okuri.core.entity.block.EntityBlocksReferenceEntity
import okuri.core.enums.core.EntityType
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface EntityBlockReferenceRepository : JpaRepository<EntityBlocksReferenceEntity, UUID> {
    fun findByEntityIdAndEntityType(entityId: UUID, entityType: EntityType): List<EntityBlocksReferenceEntity>
}