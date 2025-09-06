package okuri.core.entity.organisation

import jakarta.persistence.*
import okuri.core.entity.user.UserEntity
import okuri.core.enums.organisation.OrganisationInviteStatus
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.models.organisation.OrganisationInvite
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "organisation_invites",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uc_organisation_invites_email",
            columnNames = ["organisation_id", "email", "invite_code"]
        )
    ],
    indexes = [
        Index(name = "idx_organisation_invites_email", columnList = "email")
    ]
)
data class OrganisationInviteEntity(

    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID DEFAULT uuid_generate_v4()", updatable = false, nullable = false)
    val id: UUID? = null,

    @Column(name = "organisation_id", columnDefinition = "UUID", nullable = false)
    val organisationId: UUID,

    @Column(name = "email")
    val email: String,

    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    val role: OrganisationRoles = OrganisationRoles.MEMBER,

    @Column(name = "invite_code", length = 12, nullable = false)
    val token: String = this.generateSecureToken(),

    @Column(name = "invited_by", nullable = false, columnDefinition = "UUID")
    val invitedBy: UUID,

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    var inviteStatus: OrganisationInviteStatus = OrganisationInviteStatus.PENDING,

    @Column(name = "expires_at")
    val expiresAt: ZonedDateTime = ZonedDateTime.now().plusDays(1),

    @Column(name = "created_at", updatable = false)
    val createdAt: ZonedDateTime = ZonedDateTime.now()
) {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisation_id", referencedColumnName = "id", insertable = false, updatable = false)
    var organisation: OrganisationEntity? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", referencedColumnName = "id", insertable = false, updatable = false)
    var invitedByUser: UserEntity? = null


    companion object Factory {
        fun generateSecureToken(): String {
            val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
            return (1..12)
                .map { chars.random() }
                .joinToString("")
        }
    }
}

fun OrganisationInviteEntity.toModel(): OrganisationInvite {
    this.id.let {
        if (it == null) {
            throw IllegalArgumentException("OrganisationInviteEntity must have a non-null id")
        }
        return OrganisationInvite(
            id = it,
            organisationId = this.organisationId,
            email = this.email,
            inviteToken = this.token,
            invitedBy = this.invitedBy,
            createdAt = this.createdAt,
            expiresAt = this.expiresAt,
            role = this.role,
            status = this.inviteStatus
        )
    }
}