package okare.core.models.pdf

import java.util.*

/**
 * Represents a PDF report template (invoice, etc.).
 * type: e.g. "invoice", "report", etc.
 * templateData: JSON or other format for template structure/content.
 * isDefault: whether this is the user's default template for the type.
 * isBuiltIn: whether this is a built-in template (not user-editable).
 */
data class ReportTemplate(
    val id: UUID,
    val ownerId: UUID?, // null for built-in templates
    val name: String,
    val type: String, // e.g. "invoice"
    val templateData: String, // JSON or other format
    val isDefault: Boolean = false,
    val isBuiltIn: Boolean = false
) 