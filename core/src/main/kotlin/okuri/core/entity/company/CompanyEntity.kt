package okuri.core.entity.company

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.models.common.Address
import okuri.core.models.company.Company
import org.hibernate.annotations.Type
import java.util.*

@Entity
@Table(
    name = "companies",
    indexes = [
        Index(name = "idx_company_organisation_id", columnList = "organisation_id")
    ]
)
data class CompanyEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @Column(name = "name", length = 100, nullable = false)
    var name: String,

    @Column(name = "address", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    var address: Address? = null,

    @Column(name = "phone", length = 15)
    var phone: String? = null,

    @Column(name = "email", length = 100)
    var email: String? = null,

    @Column(name = "website", length = 100)
    var website: String? = null,

    @Column(name = "business_number", length = 50)
    var businessNumber: String? = null,

    @Column(name = "logo_url", columnDefinition = "text")
    var logoUrl: String? = null,

    @Column(name = "archived", nullable = false)
    var archived: Boolean = false,
) : AuditableEntity() {

    /**
     * Create a Company domain model from this entity.
     *
     * @param audit If true, include audit metadata (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`); otherwise those fields are null.
     * @return The Company populated with values copied from this entity.
     * @throws IllegalStateException if `id` is null.
     */
    fun toModel(audit: Boolean = false): Company {
        val id = requireNotNull(this.id) { "CompanyEntity ID cannot be null when converting to model" }
        return Company(
            id = id,
            name = this.name,
            organisationId = this.organisationId,
            address = this.address,
            phone = this.phone,
            email = this.email,
            website = this.website,
            businessNumber = this.businessNumber,
            logoUrl = this.logoUrl,
            archived = this.archived,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null,
        )

    }
}