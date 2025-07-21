package okare.core.models.template.report

import okare.core.models.template.Field

data class ReportTemplateFieldStructure(
    override val name: String,
    override val description: String? = null,
    override val type: ReportFieldType,
    override val required: Boolean = false,
    override val children: List<ReportTemplateFieldStructure> = emptyList(),
) : Field<ReportFieldType>

enum class ReportFieldType