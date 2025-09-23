package okuri.core.models.template

import okuri.core.entity.template.TemplateEntity
import java.io.Serializable
import java.time.ZonedDateTime
import java.util.*

/**
 * Represents a PDF report template (invoice, etc.).
 * type: e.g. "invoice", "report", etc.
 * templateData: JSON or other format for template structure/content.
 * isDefault: whether this is the user's default template for the type.
 * isBuiltIn: whether this is a built-in template (not user-editable).
 */
/**
 * Represents a template for clients, invoices, or reports.
 * The structure is stored as JSONB in PostgreSQL, with type-specific schemas.
 */
data class Template<T>(
    val id: UUID,
    val userId: UUID? = null, // Links to the owning user
    val name: String,
    val description: String? = null,
    val type: TemplateType,
    val structure: Map<String, T>, // JSONB for type-specific schema (fields, layout, calculations)
    val isDefault: Boolean = false,
    val isPremade: Boolean = false,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?
) : Serializable

enum class TemplateType {
    CLIENT, INVOICE, REPORT
}

/**
 * Represents a field within a template's structure.
 * Used to define custom attributes, their types, and constraints.
 */
interface Field<T> {
    val name: String
    val description: String?
    val type: T
    val required: Boolean
    val children: List<Field<T>>
}

fun <T> TemplateEntity<T>.toModel(): Template<T> {
    return Template(
        id = this.id ?: UUID.randomUUID(),
        userId = this.userId,
        name = this.name,
        description = this.description,
        type = this.type,
        structure = this.structure,
        isDefault = this.isDefault,
        isPremade = this.isPremade,
        createdAt = this.createdAt,
        updatedAt = this.updatedAt
    )
}

/**
 * Converts this Template into a persistable TemplateEntity with the same generic structure.
 *
 * The returned entity copies id, userId, name, description, type, structure, isDefault, and isPremade.
 * Note: createdAt and updatedAt are intentionally not set by this conversion (they are managed by the persistence layer).
 *
 * @return A TemplateEntity<T> containing the mapped fields from this Template.
 */
fun <T> Template<T>.toEntity(): TemplateEntity<T> {
    return TemplateEntity(
        id = this.id,
        userId = this.userId,
        name = this.name,
        description = this.description,
        type = this.type,
        structure = this.structure,
        isDefault = this.isDefault,
        isPremade = this.isPremade,
    )
}

