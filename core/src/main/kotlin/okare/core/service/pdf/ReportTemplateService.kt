package okare.core.service.pdf

import okare.core.entity.pdf.ReportTemplateEntity
import okare.core.models.pdf.ReportTemplate
import okare.core.repository.pdf.ReportTemplateRepository
import org.springframework.stereotype.Service
import java.util.*

@Service
class ReportTemplateService(
    private val repository: ReportTemplateRepository
) {
    fun getTemplatesForUser(userId: UUID, type: String): List<ReportTemplate> {
        return repository.findByTypeAndOwnerIdOrIsBuiltIn(type, userId, true)
            .map { it.toModel() }
    }

    fun getDefaultTemplateForUser(userId: UUID, type: String): ReportTemplate? {
        return repository.findByTypeAndIsDefaultAndOwnerId(type, true, userId)?.toModel()
    }

    fun getTemplateById(id: UUID): ReportTemplate? {
        return repository.findById(id).orElse(null)?.toModel()
    }

    fun createTemplate(template: ReportTemplate): ReportTemplate {
        val entity = ReportTemplateEntity(
            id = template.id,
            ownerId = template.ownerId,
            name = template.name,
            type = template.type,
            templateData = template.templateData,
            isDefault = template.isDefault,
            isBuiltIn = template.isBuiltIn
        )
        return repository.save(entity).toModel()
    }

    fun updateTemplate(template: ReportTemplate): ReportTemplate {
        val entity = repository.findById(template.id).orElseThrow { NoSuchElementException("Template not found") }
        val updated = entity.copy(
            name = template.name,
            templateData = template.templateData,
            isDefault = template.isDefault
        )
        return repository.save(updated).toModel()
    }

    fun deleteTemplate(id: UUID) {
        repository.deleteById(id)
    }
}

fun ReportTemplateEntity.toModel() = ReportTemplate(
    id = id,
    ownerId = ownerId,
    name = name,
    type = type,
    templateData = templateData,
    isDefault = isDefault,
    isBuiltIn = isBuiltIn
) 