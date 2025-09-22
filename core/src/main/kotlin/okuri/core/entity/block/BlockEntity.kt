package okuri.core.entity.block

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.models.block.structure.BlockMetadata
import org.hibernate.annotations.Type
import java.util.*

@Entity
@Table(name = "blocks")
data class BlockEntity(

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    val type: BlockTypeEntity,

    @Column(name = "name", nullable = true)
    val name: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "payload", columnDefinition = "jsonb")
    val payload: BlockMetadata,   // you can wrap with Jackson later

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    val parent: BlockEntity? = null,

    @Column(name = "archived", columnDefinition = "boolean default false")
    val archived: Boolean = false,
) : AuditableEntity()
