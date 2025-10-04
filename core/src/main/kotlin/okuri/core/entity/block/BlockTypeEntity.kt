package okuri.core.entity.block

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.enums.block.BlockValidationScope
import okuri.core.models.block.BlockType
import okuri.core.models.block.request.CreateBlockTypeRequest
import okuri.core.models.block.structure.BlockDisplay
import okuri.core.models.block.structure.BlockSchema
import org.hibernate.annotations.Type
import java.util.*

/**
 * Defines a type of block that can be used within the system. This will hold all information
 * about
 *  - The data structure of the block
 *  - The format for data input
 *  - The components and display structure when rendering the block
 */
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


    @Column(name = "source_id", columnDefinition = "uuid")
    val sourceId: UUID? = null,

    @Column(name = "system", nullable = false)
    val system: Boolean = false,

    @Column(name = "version", nullable = false, columnDefinition = "integer default 1")
    val version: Int = 1,

    @Enumerated(EnumType.STRING)
    @Column(name = "strictness", nullable = false, columnDefinition = "text default 'SOFT'")
    val strictness: BlockValidationScope = BlockValidationScope.SOFT,

    @Column(name = "schema", columnDefinition = "jsonb", nullable = false)
    @Type(JsonBinaryType::class)
    val schema: BlockSchema,

    @Column(name = "archived", nullable = false, columnDefinition = "boolean default false")
    var archived: Boolean = false,

    @Column(name = "display_structure", columnDefinition = "jsonb", nullable = false)
    @Type(JsonBinaryType::class)
    val displayStructure: BlockDisplay,
) : AuditableEntity() {
    /**
     * Convert this entity into a domain BlockType model.
     *
     * @return A BlockType populated with the entity's identifier, metadata, schema, display structure, audit fields, and related properties.
     * @throws IllegalArgumentException if the entity's `id` is null.
     */
    fun toModel(): BlockType {
        val id = requireNotNull(this.id) { "BlockTypeEntity ID cannot be null when converting to model" }

        return BlockType(
            id = id,
            key = this.key,
            version = this.version,
            name = this.displayName,
            description = this.description,
            organisationId = this.organisationId,
            system = this.system,
            schema = this.schema,
            archived = this.archived,
            strictness = this.strictness,
            display = this.displayStructure,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
            createdBy = this.createdBy,
            updatedBy = this.updatedBy,
            sourceId = this.sourceId,
        )
    }

    companion object {
        /**
         * Creates a BlockTypeEntity from a CreateBlockTypeRequest.
         *
         * Populates the entity's key, displayName, description, organisationId, strictness, schema, and displayStructure from the request and ensures `system` is set to `false` (system block types cannot be created via this method).
         *
         * @param request The create request whose fields are used to populate the entity.
         * @return A BlockTypeEntity populated from the request with `system` set to `false`.
         */
        fun fromRequest(request: CreateBlockTypeRequest): BlockTypeEntity {
            return BlockTypeEntity(
                key = request.key,
                displayName = request.name,
                description = request.description,
                // Organisation should only be null for system types
                organisationId = request.organisationId,
                // System block types cannot be created via this method
                system = false,
                strictness = request.mode,
                schema = request.schema,
                displayStructure = request.display,
            )
        }
    }
}

