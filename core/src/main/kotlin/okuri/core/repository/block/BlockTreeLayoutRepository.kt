package okuri.core.repository.block

import okuri.core.entity.block.BlockTreeLayoutEntity
import okuri.core.enums.core.EntityType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface BlockTreeLayoutRepository : JpaRepository<BlockTreeLayoutEntity, UUID> {
    fun findByEntityIdAndEntityType(
        entityId: UUID,
        entityType: EntityType
    ): Optional<BlockTreeLayoutEntity>
}
