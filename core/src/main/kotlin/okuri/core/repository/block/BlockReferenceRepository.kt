package okuri.core.repository.block

import okuri.core.entity.block.BlockReferenceEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockReferenceRepository : JpaRepository<BlockReferenceEntity, UUID> {
    fun findByBlockId(blockId: UUID): List<BlockReferenceEntity>
    fun deleteByBlockId(blockId: UUID): Long
}