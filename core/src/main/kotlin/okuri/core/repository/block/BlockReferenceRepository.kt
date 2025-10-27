package okuri.core.repository.block

import okuri.core.entity.block.BlockReferenceEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.*

interface BlockReferenceRepository : JpaRepository<BlockReferenceEntity, UUID> {
    /**
     * Deletes all block reference entities that reference the given block ID.
     *
     * @param blockId The UUID of the block whose references should be removed.
     */
    fun deleteByParentId(blockId: UUID)

    // All refs for a block that live under a specific logical prefix (e.g. "$.items")
    @Query(
        """
        select r from BlockReferenceEntity r
        where r.parentId = :blockId
          and r.path like concat(:pathPrefix, '%')
        order by r.path asc, r.orderIndex asc
    """
    )
    fun findByBlockIdAndPathPrefix(
        @Param("blockId") blockId: UUID,
        @Param("pathPrefix") pathPrefix: String
    ): List<BlockReferenceEntity>

    fun findByParentId(blockId: UUID): List<BlockReferenceEntity>

}