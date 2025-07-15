package okare.core.models.template

import okare.core.models.user.User
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.util.*

/**
 * Represents a PDF report template (invoice, etc.).
 * type: e.g. "invoice", "report", etc.
 * templateData: JSON or other format for template structure/content.
 * isDefault: whether this is the user's default template for the type.
 * isBuiltIn: whether this is a built-in template (not user-editable).
 */
abstract class Template(
    val id: UUID,
    val user: User, // null for built-in templates
    val name: String,
    val type: TemplateType,
    val structure: Map<String, Field>, // JSON or other format
    val isDefault: Boolean = false,
    val isPremade: Boolean = false, // true for built-in templates, false for user-created
    val createdAt: ZonedDateTime = ZonedDateTime.now(ZoneOffset.UTC), // Default to current time
    val updatedAt: ZonedDateTime = ZonedDateTime.now(ZoneOffset.UTC)

)

data class Field(
    val name: String,
    val type: FieldType, // e.g. "text", "number", "date", etc.
    val value: Any? = null, // Default to null if not set
    val required: Boolean = false, // Whether this field is required
    val children: List<Field> = emptyList() // For nested fields
)

enum class FieldType

enum class TemplateType {
    INVOICE, CLIENT, REPORT
}