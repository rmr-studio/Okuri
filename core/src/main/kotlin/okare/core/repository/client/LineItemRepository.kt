package okare.core.repository.client

import okare.core.entity.invoice.LineItemEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface LineItemRepository : JpaRepository<LineItemEntity, UUID> {
    fun findByUserId(userId: UUID): List<LineItemEntity>

    fun findByNameAndUserId(name: String, userId: UUID): LineItemEntity?

    fun existsByNameAndUserId(name: String, userId: UUID): Boolean

    fun deleteByNameAndUserId(name: String, userId: UUID): Int
}