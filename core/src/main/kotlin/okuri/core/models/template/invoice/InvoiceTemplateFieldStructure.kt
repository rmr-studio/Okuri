package okuri.core.models.template.invoice

import okuri.core.models.template.Field

data class InvoiceTemplateFieldStructure(
    override val name: String,
    override val description: String? = null,
    override val type: InvoiceFieldType,
    override val required: Boolean = false,
    override val children: List<InvoiceTemplateFieldStructure> = emptyList(),
) : Field<InvoiceFieldType>

enum class InvoiceFieldType

