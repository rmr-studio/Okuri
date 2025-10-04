package okuri.core.service.util.factory

import okuri.core.entity.organisation.OrganisationEntity
import okuri.core.entity.organisation.OrganisationInviteEntity
import okuri.core.entity.organisation.OrganisationMemberEntity
import okuri.core.entity.user.UserEntity
import okuri.core.enums.organisation.OrganisationInviteStatus
import okuri.core.enums.organisation.OrganisationRoles
import java.util.*

object OrganisationFactory {

    fun createOrganisation(
        id: UUID = UUID.randomUUID(),
        name: String = "Test Organisation",
        members: MutableSet<OrganisationMemberEntity> = mutableSetOf()
    ) = OrganisationEntity(
        id = id,
        name = name,
    ).apply {
        this.members = members
    }

    fun createOrganisationMember(
        user: UserEntity,
        organisationId: UUID,
        role: OrganisationRoles = OrganisationRoles.MEMBER,
    ): OrganisationMemberEntity {
        user.id.let {
            if (it == null) {
                throw IllegalArgumentException("User ID must not be null")
            }

            return OrganisationMemberEntity(
                id = OrganisationMemberEntity.OrganisationMemberKey(
                    organisationId = organisationId,
                    userId = it
                ),
                role = role,
            ).apply {
                this.user = user
            }
        }
    }

    fun createOrganisationInvite(
        email: String,
        organisationId: UUID,
        role: OrganisationRoles = OrganisationRoles.MEMBER,
        token: String = OrganisationInviteEntity.generateSecureToken(),
        invitedBy: UUID = UUID.randomUUID(),
        status: OrganisationInviteStatus = OrganisationInviteStatus.PENDING
    ) = OrganisationInviteEntity(
        id = UUID.randomUUID(),
        email = email,
        organisationId = organisationId,
        role = role,
        token = token,
        inviteStatus = status,
        invitedBy = invitedBy
    )


}