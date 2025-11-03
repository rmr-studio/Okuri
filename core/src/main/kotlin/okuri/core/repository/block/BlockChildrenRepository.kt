package okuri.core.repository.block

import okuri.core.entity.block.BlockChildEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.*

interface BlockChildrenRepository : JpaRepository<BlockChildEntity, UUID> {
    fun findByParentIdOrderByOrderIndexAsc(parentId: UUID): List<BlockChildEntity>
    fun findByParentIdAndChildId(parentId: UUID, childId: UUID): BlockChildEntity?
    fun findByChildId(childId: UUID): BlockChildEntity?
    fun deleteAllByParentId(parentId: UUID)
    fun countByParentId(parentId: UUID): Int

    @Query(
        """
        select e.parentId
        from BlockChildEntity e
        where e.childId = :childId
        """
    )
    fun findParentIdsByChildId(childId: UUID): List<UUID>
}