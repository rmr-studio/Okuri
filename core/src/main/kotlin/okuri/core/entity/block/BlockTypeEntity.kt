package okuri.core.entity.block

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.models.block.type.BlockSchema
import okuri.core.models.block.type.BlockUiHint
import org.hibernate.annotations.Type
import java.util.*

@Entity
@Table(
    name = "block_types",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["organisation_id", "key"])
    ]
)
data class BlockTypeEntity(

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "key", nullable = false)
    val key: String,

    @Column(name = "display_name", nullable = false)
    val displayName: String,

    @Column(name = "description", nullable = true)
    val description: String? = null,

    @Column(name = "organisation_id", columnDefinition = "uuid")
    val organisationId: UUID? = null,

    @Column(name = "private", nullable = false)
    val private: Boolean = false,

    @Column(name = "system", nullable = false)
    val system: Boolean = false,

    @Column(name = "schema", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    val schema: BlockSchema? = null,

    @Column(name = "ui_hints", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    val uiHints: BlockUiHint? = null,
) : AuditableEntity()