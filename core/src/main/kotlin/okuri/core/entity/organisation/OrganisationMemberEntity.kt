package okuri.core.entity.organisation

import jakarta.persistence.*
import okuri.core.entity.user.UserEntity
import okuri.core.entity.user.toDisplay
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.models.organisation.MembershipDetails
import okuri.core.models.organisation.OrganisationMember
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "organisation_members",
)
data class OrganisationMemberEntity(
    // User ID + Organisation ID as composite key
    @EmbeddedId
    val id: OrganisationMemberKey,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, updatable = true)
    var role: OrganisationRoles,

    @Column(name = "member_since", nullable = false, updatable = false)
    val memberSince: ZonedDateTime = ZonedDateTime.now(),
) {
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    var user: UserEntity? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "organisation_id",
        referencedColumnName = "id",
        insertable = false,
        updatable = false
    )
    var organisation: OrganisationEntity? = null

    @Embeddable
    data class OrganisationMemberKey(
        @Column(name = "organisation_id", nullable = false)
        val organisationId: UUID,

        @Column(name = "user_id", nullable = false)
        val userId: UUID
    )
}

fun OrganisationMemberEntity.toModel(): OrganisationMember {
    this.user.let {
        if (it == null) {
            throw IllegalArgumentException("OrganisationMemberEntity must have a non-null user")
        }

        if (it.id == null) {
            throw IllegalArgumentException("UserEntity must have a non-null id")
        }

        return OrganisationMember(
            user = it.toDisplay(),
            membershipDetails = this.toDetails(),
        )
    }
}

/**
 * Convert OrganisationMemberEntity to MembershipDetails
 * This excludes user and organisation details and will be used to hold a user's membership info for their profile.
 */
fun OrganisationMemberEntity.toDetails(includeOrganisation: Boolean = false): MembershipDetails {
    return MembershipDetails(
        organisation = if (includeOrganisation) {
            this.organisation?.toModel(includeMetadata = false)
        } else {
            null
        },
        role = role,
        memberSince = memberSince,
    )
}

