package okuri.core.entity.organisation

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.entity.util.AuditableEntity
import okuri.core.enums.organisation.OrganisationPlan
import okuri.core.models.common.Address
import okuri.core.models.organisation.Organisation
import okuri.core.models.organisation.OrganisationPaymentDetails
import org.hibernate.annotations.Type
import java.util.*

@Entity
@Table(
    name = "organisations",
    uniqueConstraints = [
        UniqueConstraint(name = "organisation_name_unique", columnNames = ["name"])
    ]
)
data class OrganisationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "UUID DEFAULT uuid_generate_v4()", nullable = false)
    val id: UUID? = null,

    @Column(name = "name", nullable = false, updatable = true)
    var name: String,

    @Column(name = "default_currency", nullable = false, updatable = true)
    var defaultCurrency: Currency = Currency.getInstance("AUD"), // Default currency for the organisation

    @Column(name = "avatarUrl", nullable = true, updatable = true)
    var avatarUrl: String? = null,

    @Column(name = "member_count", nullable = false, updatable = false)
    val memberCount: Int = 0,

    @Type(JsonBinaryType::class)
    @Column(name = "address", nullable = true, columnDefinition = "jsonb")
    var address: Address? = null,

    @Column(name = "business_number", nullable = true, updatable = true)
    var businessNumber: String? = null,

    @Column(name = "tax_id", nullable = true, updatable = true)
    var taxId: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "payment_details", nullable = true, updatable = true, columnDefinition = "jsonb")
    var organisationPaymentDetails: OrganisationPaymentDetails? = null, // Optional, can be null if not applicable

    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false)
    var plan: OrganisationPlan = OrganisationPlan.FREE, // Default plan is FREE

) : AuditableEntity() {
    @OneToMany(mappedBy = "organisation", cascade = [CascadeType.ALL], fetch = FetchType.LAZY, orphanRemoval = true)
    var members: MutableSet<OrganisationMemberEntity> = mutableSetOf()

    @OneToMany(mappedBy = "organisation", cascade = [CascadeType.ALL], fetch = FetchType.LAZY, orphanRemoval = true)
    var invites: MutableSet<OrganisationInviteEntity> = mutableSetOf()
}

/**
 * Converts this OrganisationEntity into a domain Organisation model.
 *
 * When `includeMetadata` is true, member and invite entities are converted and populated;
 * otherwise those lists are returned empty. The resulting model uses the entity's
 * persisted timestamps (inherited from AuditableEntity).
 *
 * @param includeMetadata If true, include converted members and invites in the returned model.
 * @return A populated [Organisation] domain model representing this entity.
 * @throws IllegalArgumentException if this entity's `id` is null.
 */
fun OrganisationEntity.toModel(includeMetadata: Boolean = false): Organisation {
    val id = requireNotNull(this.id) { "OrganisationEntity must have a non-null id" }
    return Organisation(
        id = id,
        name = this.name,
        plan = this.plan,
        defaultCurrency = this.defaultCurrency,
        avatarUrl = this.avatarUrl,
        memberCount = this.memberCount,
        createdAt = this.createdAt,
        businessNumber = this.businessNumber,
        taxId = this.taxId,
        organisationPaymentDetails = this.organisationPaymentDetails,
        members = if (includeMetadata) {
            this.members.map { member -> member.toModel() }
        } else {
            emptyList()
        },
        invites = if (includeMetadata) {
            this.invites.map { invite -> invite.toModel() }
        } else {
            emptyList()
        }
    )
}

/**
 * Converts this domain Organisation model into a persistable OrganisationEntity.
 *
 * Maps primary scalar and JSON-backed fields (id, name, avatarUrl, memberCount,
 * businessNumber, taxId, organisationPaymentDetails, customAttributes, tileLayout,
 * address, plan). Does not populate relational collections (members, invites) or
 * audit fields — those are handled by the entity lifecycle / base class.
 *
 * @return A new OrganisationEntity with values copied from this Organisation.
 */
fun Organisation.toEntity(): OrganisationEntity {
    return OrganisationEntity(
        id = this.id,
        name = this.name,
        avatarUrl = this.avatarUrl,
        memberCount = this.memberCount,
        businessNumber = this.businessNumber,
        taxId = this.taxId,
        organisationPaymentDetails = this.organisationPaymentDetails,
        address = this.address,
        plan = this.plan
    )
}
