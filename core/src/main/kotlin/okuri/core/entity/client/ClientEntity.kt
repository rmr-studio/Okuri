package okuri.core.entity.client

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.company.CompanyEntity
import okuri.core.entity.util.AuditableEntity
import okuri.core.models.block.Referenceable
import okuri.core.models.client.Client
import okuri.core.models.common.Contact
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
    var contact: Contact,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = true)
    var company: CompanyEntity? = null,

    @Column(name = "company_role", nullable = true)
    var companyRole: String? = null,

    @Column(name = "type_metadata", columnDefinition = "jsonb", nullable = true)
    @Type(JsonBinaryType::class)
    var metadata: ClientTypeMetadataReference? = null,

    @Column(name = "attributes", columnDefinition = "jsonb", nullable = true)
    @Type(JsonBinaryType::class)
    var attributes: BlockTreeEntityReference? = null,
) : AuditableEntity(), Referenceable<Client> {
    override fun toReference() = this.toModel()

    /**
     * Converts this persistent ClientEntity to a semi-structured Client model.
     *
     * This would require additional service layer logic to reconstruct a more detailed model
     * with all metadata and attributes fully populated.
     *
     * @return a Client domain model with values copied from this entity.
     * @throws IllegalStateException if `id` is null.
     */
    fun toModel(audit: Boolean = false): Client {
        val id = requireNotNull(this.id) { "ClientEntity ID cannot be null when converting to model" }
        return Client(
            id = id,
            organisationId = this.organisationId,
            name = this.name,
            contact = this.contact,
            company = this.company?.toModel(),
            role = this.companyRole,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null,
        )
    }

}

