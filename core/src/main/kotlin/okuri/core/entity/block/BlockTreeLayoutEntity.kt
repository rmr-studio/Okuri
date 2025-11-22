package okuri.core.entity.block

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.enums.core.EntityType
import okuri.core.models.block.layout.TreeLayout
import okuri.core.models.block.tree.BlockTreeLayout
import org.hibernate.annotations.Type
import java.util.*


/**
 * Entity for persisting block tree layouts with support for multiple layouts per block.
 *
 * Supports different layout scopes:
 * - ORGANIZATION: Default layout for all users in the org
 * - USER: Personalized layout for a specific user
 * - TEAM: Shared layout for a team/group
 *
 * Layout Resolution Priority:
 * 1. User-specific layout (if exists)
 * 2. Team layout (if user is in team and layout exists)
 * 3. Organization default layout
 */
@Entity
@Table(
    name = "block_tree_layouts",
    uniqueConstraints = [
        // Ensure only one layout per scope combination
        UniqueConstraint(
            name = "uq_block_tree_layouts_entity",
            columnNames = ["entity_id"]
        )
    ],
    indexes = [
        Index(name = "idx_block_tree_layouts_entity_id_entity_type", columnList = "entity_id, entity_type"),
        Index(name = "idx_block_tree_layouts_organisation_id", columnList = "organisation_id"),
    ]
)
data class BlockTreeLayoutEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    /**
     * The page (of blocks) this layout applies to
     */
    @Column(name = "entity_id", nullable = false, columnDefinition = "uuid")
    val entityId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    val entityType: EntityType,

    @Column(name = "organisation_id", nullable = false, columnDefinition = "uuid")
    val organisationId: UUID,

    @Column(name = "version", nullable = false)
    var version: Int = 1,

    /**
     * The complete Gridstack layout configuration
     * Stores all positioning, dimensions, grid options, and nested sub-grids
     */
    @Type(JsonBinaryType::class)
    @Column(name = "layout", columnDefinition = "jsonb", nullable = false)
    var layout: TreeLayout,
) : AuditableEntity() {
    fun toModel(audit: Boolean = false): BlockTreeLayout {
        val id = requireNotNull(this.id) { "BlockTreeLayoutEntity ID cannot be null when converting to model" }
        return BlockTreeLayout(
            id = id,
            organisationId = this.organisationId,
            layout = this.layout,
            version = this.version,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null,
        )
    }

}