package okuri.core.entity.company

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.block.BlockTreeEntityReference
import okuri.core.entity.util.AuditableEntity
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
    val name: String,

    @Column(name = "address", columnDefinition = "jsonb")
    val address: String? = null, // You can use a JSON mapper to deserialize into a structured type

    @Column(name = "phone", length = 15)
    val phone: String? = null,

    @Column(name = "email", length = 100)
    val email: String? = null,

    @Column(name = "website", length = 100)
    val website: String? = null,

    @Column(name = "business_number", length = 50)
    val businessNumber: String? = null,

    @Column(name = "logo_url", columnDefinition = "text")
    val logoUrl: String? = null,

    @Column(name = "attributes", columnDefinition = "jsonb", nullable = true)
    @Type(JsonBinaryType::class)
    var attributes: BlockTreeEntityReference? = null,
) : AuditableEntity()
