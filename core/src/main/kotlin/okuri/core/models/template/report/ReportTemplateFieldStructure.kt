package okuri.core.models.template.report

import okuri.core.models.template.Field

data class ReportTemplateFieldStructure(
    override val name: String,
    override val description: String? = null,
    override val type: ReportFieldType,
    override val required: Boolean = false,
    override val children: List<ReportTemplateFieldStructure> = emptyList(),
) : Field<ReportFieldType>

enum class ReportFieldType