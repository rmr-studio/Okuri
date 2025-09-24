package okuri.core.entity.block

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.enums.block.BlockTypeScope
import okuri.core.models.block.BlockType
import okuri.core.models.block.structure.BlockDisplay
import okuri.core.models.block.structure.BlockSchema
import org.hibernate.annotations.Type
import java.util.*

@Entity
@Table(
    name = "block_types",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["organisation_id", "key"])
    ],
    indexes = [
        Index(name = "idx_block_types_organisation_id", columnList = "organisation_id")
    ]
)
data class BlockTypeEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false)
    val scope: BlockTypeScope = BlockTypeScope.ORGANISATION,

    @Column(name = "system", nullable = false)
    val system: Boolean = false,

    @Column(name = "schema", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    val schema: BlockSchema? = null,

    @Column(name = "display_structure", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    val displayStructure: BlockDisplay? = null,
) : AuditableEntity()

fun BlockTypeEntity.toModel(): BlockType {
    val id = requireNotNull(this.id) { "BlockTypeEntity ID cannot be null when converting to model" }

    return BlockType(
        id = id,
        key = this.key,
        name = this.displayName,
        description = this.description,
        organisationId = this.organisationId,
        scope = this.scope,
        system = this.system,
        schema = this.schema,
        display = this.displayStructure,
        createdAt = this.createdAt,
        updatedAt = this.updatedAt,
        createdBy = this.createdBy,
        updatedBy = this.updatedBy,
    )
}