package okuri.core.repository.billable

import okuri.core.entity.invoice.LineItemEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface LineItemRepository : JpaRepository<LineItemEntity, UUID> {
    fun findByOrganisationId(organisationId: UUID): List<LineItemEntity>
}