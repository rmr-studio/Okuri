package okuri.core.repository.pdf

import okuri.core.entity.pdf.ReportTemplateEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface ReportTemplateRepository : JpaRepository<ReportTemplateEntity, UUID> {
    fun findByOwnerId(ownerId: UUID): List<ReportTemplateEntity>
    fun findByTypeAndOwnerIdOrPremade(type: String, ownerId: UUID, premade: Boolean = true): List<ReportTemplateEntity>
    fun findByTypeAndDefaultAndOwnerId(type: String, isDefault: Boolean, ownerId: UUID): ReportTemplateEntity?
} 