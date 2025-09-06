package okuri.core.entity.pdf

import jakarta.persistence.*
import java.util.*

@Entity
@Table(name = "report_templates")
data class ReportTemplateEntity(
    @Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "owner_id", columnDefinition = "uuid", nullable = true)
    val ownerId: UUID? = null, // null for built-in templates

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false)
    val type: String, // e.g. "invoice"

    @Lob
    @Column(name = "template_data", nullable = false)
    val templateData: String, // JSON or other format

    @Column(name = "is_default", nullable = false)
    val default: Boolean = false,

    @Column(name = "is_premade", nullable = false)
    val premade: Boolean = false
) 