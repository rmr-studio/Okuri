package okare.core.repository.pdf

import okare.core.entity.pdf.ReportTemplateEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface ReportTemplateRepository : JpaRepository<ReportTemplateEntity, UUID> {
    fun findByOwnerId(ownerId: UUID): List<ReportTemplateEntity>
    fun findByTypeAndOwnerIdOrIsBuiltIn(type: String, ownerId: UUID, isBuiltIn: Boolean = true): List<ReportTemplateEntity>
    fun findByTypeAndIsDefaultAndOwnerId(type: String, isDefault: Boolean, ownerId: UUID): ReportTemplateEntity?
} 