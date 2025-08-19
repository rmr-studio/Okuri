package okare.core.entity.organisation

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.enums.organisation.OrganisationPlan
import okare.core.models.common.Address
import okare.core.models.organisation.Organisation
import okare.core.models.organisation.OrganisationPaymentDetails
import org.hibernate.annotations.Type
import java.time.ZonedDateTime
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
    @GeneratedValue
    @Column(name = "id", columnDefinition = "UUID DEFAULT uuid_generate_v4()", nullable = false)
    val id: UUID? = null,

    @Column(name = "name", nullable = false, updatable = true)
    var name: String,

    @Column(name = "plan", nullable = false, updatable = true)
    @Enumerated(EnumType.STRING)
    var plan: OrganisationPlan = OrganisationPlan.FREE,

    @Column(name = "default_currency", nullable = false, updatable = true)
    var defaultCurrency: Currency = Currency.getInstance("AUD"), // Default currency for the organisation

    @Column(name = "avatarUrl", nullable = true, updatable = true)
    var avatarUrl: String? = null,

    @Column(name = "member_count", nullable = false, updatable = false)
    val memberCount: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: ZonedDateTime = ZonedDateTime.now(),

    @Column(name = "updated_at", nullable = false, updatable = true)
    var updatedAt: ZonedDateTime = ZonedDateTime.now(),

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

    @Type(JsonBinaryType::class)
    @Column(name = "custom_attributes", nullable = true, updatable = true, columnDefinition = "jsonb")
    var customAttributes: Map<String, Any> = emptyMap() // JSONB for industry-specific fields

) {
    @OneToMany(mappedBy = "organisation", cascade = [CascadeType.ALL], fetch = FetchType.LAZY, orphanRemoval = true)
    var members: MutableSet<OrganisationMemberEntity> = mutableSetOf()

    @OneToMany(mappedBy = "organisation", cascade = [CascadeType.ALL], fetch = FetchType.LAZY, orphanRemoval = true)
    var invites: MutableSet<OrganisationInviteEntity> = mutableSetOf()

    @PrePersist
    fun onPrePersist() {
        createdAt = ZonedDateTime.now()
        updatedAt = ZonedDateTime.now()
    }

    @PreUpdate
    fun onPreUpdate() {
        updatedAt = ZonedDateTime.now()
    }
}

fun OrganisationEntity.toModel(includeMembers: Boolean = false): Organisation {
    this.id?.let {
        return Organisation(
            id = it,
            name = this.name,
            plan = this.plan,
            defaultCurrency = this.defaultCurrency,
            avatarUrl = this.avatarUrl,
            memberCount = this.memberCount,
            createdAt = this.createdAt,
            businessNumber = this.businessNumber,
            taxId = this.taxId,
            organisationPaymentDetails = this.organisationPaymentDetails,
            customAttributes = this.customAttributes,
            members = if (includeMembers) {
                this.members.map { member -> member.toModel() }
            } else {
                emptyList()
            },
        )
    } ?: throw IllegalArgumentException("OrganisationEntity must have a non-null id")
}

fun Organisation.toEntity(): OrganisationEntity {
    return OrganisationEntity(
        id = this.id,
        name = this.name,
        avatarUrl = this.avatarUrl,
        createdAt = this.createdAt,
        memberCount = this.memberCount,
        businessNumber = this.businessNumber,
        taxId = this.taxId,
        organisationPaymentDetails = this.organisationPaymentDetails,
        customAttributes = this.customAttributes,
        address = this.address,
    )
}