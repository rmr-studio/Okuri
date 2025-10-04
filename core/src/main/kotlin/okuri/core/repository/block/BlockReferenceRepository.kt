package okuri.core.repository.block

import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockReferenceRepository : JpaRepository<BlockReferenceEntity, UUID> {
    /**
 * Deletes all block reference entities that reference the given block ID.
 *
 * @param blockId The UUID of the block whose references should be removed.
 */
fun deleteByBlockId(blockId: UUID)
    /**
     * Finds block reference entities that match the specified block ID, ownership, and entity type, ordered by path (ascending) then order index (ascending).
     *
     * @param blockId The UUID of the referenced block.
     * @param ownership The ownership classification to filter by.
     * @param entityType The entity type to filter by; defaults to EntityType.BLOCK.
     * @return A list of matching BlockReferenceEntity objects ordered by path ascending then orderIndex ascending.
     */
    fun findByBlockIdAndOwnershipAndEntityTypeOrderByPathAscOrderIndexAsc(
        blockId: UUID,
        ownership: BlockOwnership,
        entityType: EntityType = EntityType.BLOCK
    ): List<BlockReferenceEntity>

    /**
 * Retrieves all block reference entities for the given block ID, ordered by path then orderIndex in ascending order.
 *
 * @return A list of BlockReferenceEntity instances that match the provided block ID, ordered by `path` (ascending) then `orderIndex` (ascending).
 */
fun findByBlockIdOrderByPathAscOrderIndexAsc(blockId: UUID): List<BlockReferenceEntity>
}