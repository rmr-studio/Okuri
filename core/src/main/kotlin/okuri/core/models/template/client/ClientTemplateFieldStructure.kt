package okuri.core.models.template.client

import okuri.core.models.template.Field

data class ClientTemplateFieldStructure(
    override val name: String,
    override val description: String? = null,
    override val type: ClientFieldType,
    override val required: Boolean = false,
    override val children: List<ClientTemplateFieldStructure> = emptyList(),
    val constraints: List<Constraint>? = null, // Constraints like min length, regex, etc.
    val options: List<String>? = null, // For fields like dropdowns or checkboxes
    val defaultValue: Any? = null, // Default value for the field
) : Field<ClientFieldType>

enum class ClientFieldType {
    TEXT, NUMBER, DATE, BOOLEAN, SELECT, MULTISELECT, OBJECT
}

enum class ClientFieldConstraint {
    MIN_LENGTH, // e.g., 1 character
    MAX_LENGTH, // e.g., 255 characters
    PATTERN, // e.g., regex pattern
    REQUIRED, // No Value needed, just indicates required field
    UNIQUE, // No Value needed, just indicates uniqueness
    CUSTOM, // for custom validation logic
    TYPE // e.g., "email" | "phone" | "integer" | "decimal"
}

data class Constraint(
    val type: ClientFieldConstraint,
    val value: String? = null // Value for the constraint, e.g., min length, regex pattern
)