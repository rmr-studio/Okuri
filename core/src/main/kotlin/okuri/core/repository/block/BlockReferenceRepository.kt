package okuri.core.repository.block

import okuri.core.entity.block.BlockReferenceEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.*

interface BlockReferenceRepository : JpaRepository<BlockReferenceEntity, UUID> {
    /**
     * Deletes all block reference entities that reference the given block ID.
     *
     * @param blockId The UUID of the block whose references should be removed.
     */
    fun deleteByParentBlockId(blockId: UUID)

    @Query(
        """
        SELECT bre FROM BlockReferenceEntity bre
        WHERE bre.parentBlock.id = :blockId
        AND bre.ownership = 'LINKED'
    """
    )
    fun findReferencedBlock(
        blockId: UUID,
    ): List<BlockReferenceEntity>

    @Query(
        """
        SELECT bre FROM BlockReferenceEntity bre
        WHERE bre.parentBlock.id = :blockId
          AND bre.entityType = 'BLOCK'
          AND bre.ownership = 'OWNED'
    """
    )
    fun findChildBlocks(
        blockId: UUID,
    ): List<BlockReferenceEntity>
}