package okuri.core.entity.client

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.template.TemplateEntity
import okuri.core.entity.util.AuditableEntity
import okuri.core.models.block.Referenceable
import okuri.core.models.client.Client
import okuri.core.models.common.Contact
import okuri.core.models.template.client.ClientTemplateFieldStructure
import okuri.core.models.template.toModel
import org.hibernate.annotations.Type
import java.util.*

@Entity
@Table(
    name = "clients",
    indexes = [
        Index(name = "idx_client_organisation_id", columnList = "organisation_id")
    ]
)
data class ClientEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "archived", nullable = false)
    var archived: Boolean = false,

    @Column(name = "contact_details", columnDefinition = "jsonb", nullable = false)
    @Type(JsonBinaryType::class)
    var contactDetails: Contact,

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "template_id", referencedColumnName = "id")
    var template: TemplateEntity<ClientTemplateFieldStructure>? = null, // Link to which template was used for client structure

    @Column(name = "attributes", columnDefinition = "jsonb", nullable = true)
    @Type(JsonBinaryType::class)
    var attributes: Map<String, Any>? = null, // E.g., {"industry": "Healthcare", "size": "50-100"}
) : AuditableEntity(), Referenceable<Client> {
    override fun toReference() = this.toModel()

    /**
     * Converts this persistent ClientEntity to a domain Client model.
     *
     * Returns a Client populated from the entity fields. The entity's `id` must be non-null.
     *
     * @return a Client domain model with values copied from this entity.
     * @throws IllegalStateException if `id` is null.
     */
    fun toModel(): Client {
        val id = requireNotNull(this.id) { "ClientEntity ID cannot be null when converting to model" }
        return Client(
            id = id,
            organisationId = this.organisationId,
            template = this.template?.toModel(),
            name = this.name,
            contactDetails = this.contactDetails,
            attributes = this.attributes
        )


    }

}

