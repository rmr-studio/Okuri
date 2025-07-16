package okare.core.entity.template

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.models.template.TemplateType
import org.hibernate.annotations.Type
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
@Entity
@Table
data class TemplateEntity<T>(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,
    val userId: UUID, // Links to the owning user


    val name: String,
    @Column(name = "description", nullable = true)
    val description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    val type: TemplateType,

    @Column(name = "structure", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    val structure: Map<String, T>, // JSONB for type-specific schema (fields, layout, calculations)

    val isDefault: Boolean = false,
    val isPremade: Boolean = false,
    val createdAt: ZonedDateTime = ZonedDateTime.now(),
    val updatedAt: ZonedDateTime = ZonedDateTime.now()
) : Serializable


