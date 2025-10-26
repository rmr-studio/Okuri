package okuri.core.repository.block

import okuri.core.entity.block.BlockChildEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.*

interface BlockChildrenRepository : JpaRepository<BlockChildEntity, UUID> {
    fun findByParentIdOrderBySlotAscOrderIndexAsc(parentId: UUID): List<BlockChildEntity>

    fun findByParentIdAndSlotOrderByOrderIndexAsc(parentId: UUID, slot: String): List<BlockChildEntity>

    fun findByParentIdAndChildId(parentId: UUID, childId: UUID): BlockChildEntity?

    fun findByChildId(childId: UUID): List<BlockChildEntity>

    fun deleteAllByParentIdAndSlot(parentId: UUID, slot: String)

    fun deleteAllByParentId(parentId: UUID)

    fun countByParentIdAndSlot(parentId: UUID, slot: String): Long

    @Query(
        """
        select e.parentId
        from BlockChildEntity e
        where e.childId = :childId
        """
    )
    fun findParentIdsByChildId(childId: UUID): List<UUID>
}