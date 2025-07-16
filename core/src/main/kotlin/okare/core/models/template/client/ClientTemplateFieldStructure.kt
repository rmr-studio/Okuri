package okare.core.models.template.client

import okare.core.models.template.Field

data class ClientTemplateFieldStructure(
    override val name: String,
    override val description: String? = null,
    override val type: ClientFieldType,
    override val required: Boolean = false,
    override val children: List<Field<ClientFieldType>>,
    val constraints: Map<ClientFieldConstraint, Any> = emptyMap(), // E.g., {"minLength": 3, "maxLength": 255}
    val options: List<String> = emptyList(), // For fields like dropdowns or checkboxes
    val defaultValue: Any? = null, // Default value for the field
) : Field<ClientFieldType>

enum class ClientFieldType {
    TEXT, NUMBER, DATE, BOOLEAN, SELECT, MULTISELECT, OBJECT
}

enum class ClientFieldConstraint {
    MIN_LENGTH, MAX_LENGTH, PATTERN, REQUIRED, UNIQUE, CUSTOM
}