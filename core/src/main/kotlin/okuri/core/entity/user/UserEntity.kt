package okuri.core.entity.user

import jakarta.persistence.*
import okuri.core.entity.organisation.OrganisationEntity
import okuri.core.entity.organisation.OrganisationMemberEntity
import okuri.core.entity.organisation.toDetails
import okuri.core.entity.organisation.toModel
import okuri.core.models.user.User
import okuri.core.models.user.UserDisplay
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "users",
)
data class UserEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "email", nullable = false)
    var email: String,

    @Column(name = "phone", nullable = true)
    var phone: String?,

    @Column(name = "avatar_url", nullable = true)
    var avatarUrl: String? = null,

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    ) var createdAt: ZonedDateTime = ZonedDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_organisation_id", referencedColumnName = "id", insertable = true, updatable = true)
    var defaultOrganisation: OrganisationEntity? = null,

    @Column(name = "updated_at", nullable = false) var updatedAt: ZonedDateTime = ZonedDateTime.now()
) {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    var organisations: MutableSet<OrganisationMemberEntity> = mutableSetOf()

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

fun UserEntity.toModel(): User {
    this.id.let {
        if (it == null) {
            throw IllegalArgumentException("UserEntity id cannot be null")
        }
        return User(
            id = it,
            email = this.email,
            phone = this.phone,
            name = this.name,
            avatarUrl = this.avatarUrl,
            memberships = this.organisations.map { membership -> membership.toDetails(includeOrganisation = true) },
            defaultOrganisation = this.defaultOrganisation?.toModel(includeMetadata = false),
        )
    }
}

fun UserEntity.toDisplay(): UserDisplay {
    this.id.let {
        if (it == null) {
            throw IllegalArgumentException("UserEntity id cannot be null")
        }
        return UserDisplay(
            id = it,
            email = this.email,
            name = this.name,
            avatarUrl = this.avatarUrl,
        )
    }
}