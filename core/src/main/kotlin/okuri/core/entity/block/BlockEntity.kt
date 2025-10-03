package okuri.core.entity.block

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.models.block.Block
import okuri.core.models.block.Referenceable
import okuri.core.models.block.structure.BlockMetadata
import org.hibernate.annotations.Type
import java.util.*

@Entity
@Table(name = "blocks")
data class BlockEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    val type: BlockTypeEntity,

    @Column(name = "name", nullable = true)
    var name: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "payload", columnDefinition = "jsonb", nullable = false)
    var payload: BlockMetadata,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    val parent: BlockEntity? = null,

    @Column(name = "archived", columnDefinition = "boolean default false")
    var archived: Boolean = false,

    @Version
    @Column(name = "row_version")
    val rowVersion: Long? = null
) : AuditableEntity(), Referenceable<Block> {

    override fun toReference() = this.toModel(audit = false)

    fun toModel(audit: Boolean = false): Block {
        val id = requireNotNull(this.id) { "BlockEntity ID cannot be null when converting to model" }
        return Block(
            id = id,
            organisationId = this.organisationId,
            type = this.type.toModel(),
            name = this.name,
            payload = this.payload,
            archived = this.archived,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null,
        )
    }


}

