package okare.core.controller.pdf

import okare.core.models.pdf.ReportTemplate
import okare.core.service.pdf.ReportTemplateService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/report-templates")
class ReportTemplateController(
    private val reportTemplateService: ReportTemplateService
) {
    @GetMapping
    fun getTemplatesForUser(
        @RequestParam userId: UUID,
        @RequestParam type: String
    ): List<ReportTemplate> = reportTemplateService.getTemplatesForUser(userId, type)

    @GetMapping("/default")
    fun getDefaultTemplate(
        @RequestParam userId: UUID,
        @RequestParam type: String
    ): ResponseEntity<ReportTemplate> {
        val template = reportTemplateService.getDefaultTemplateForUser(userId, type)
        return if (template != null) ResponseEntity.ok(template) else ResponseEntity.notFound().build()
    }

    @GetMapping("/{id}")
    fun getTemplateById(@PathVariable id: UUID): ResponseEntity<ReportTemplate> {
        val template = reportTemplateService.getTemplateById(id)
        return if (template != null) ResponseEntity.ok(template) else ResponseEntity.notFound().build()
    }

    @PostMapping
    fun createTemplate(@RequestBody template: ReportTemplate): ReportTemplate =
        reportTemplateService.createTemplate(template)

    @PutMapping("/{id}")
    fun updateTemplate(@PathVariable id: UUID, @RequestBody template: ReportTemplate): ReportTemplate =
        reportTemplateService.updateTemplate(template.copy(id = id))

    @DeleteMapping("/{id}")
    fun deleteTemplate(@PathVariable id: UUID) = reportTemplateService.deleteTemplate(id)
} 