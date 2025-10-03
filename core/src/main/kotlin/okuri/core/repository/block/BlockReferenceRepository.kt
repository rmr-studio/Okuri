package okuri.core.repository.block

import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockReferenceRepository : JpaRepository<BlockReferenceEntity, UUID> {
    fun deleteByBlockId(blockId: UUID)
    fun findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
        blockId: UUID,
        ownership: BlockOwnership,
        entityType: EntityType = EntityType.BLOCK
    ): List<BlockReferenceEntity>
}