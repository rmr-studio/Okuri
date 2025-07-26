package okare.core.entity.organisation

import jakarta.persistence.*
import okare.core.entity.user.UserEntity
import okare.core.enums.organisation.OrganisationInviteStatus
import okare.core.enums.organisation.OrganisationRoles
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