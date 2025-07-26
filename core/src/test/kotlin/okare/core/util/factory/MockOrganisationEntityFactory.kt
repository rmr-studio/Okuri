package okare.core.util.factory

import okare.core.entity.organisation.OrganisationEntity
import okare.core.entity.organisation.OrganisationInviteEntity
import okare.core.entity.organisation.OrganisationMemberEntity
import okare.core.entity.user.UserEntity
import okare.core.enums.organisation.OrganisationInviteStatus
import okare.core.enums.organisation.OrganisationRoles
import java.util.*

object MockOrganisationEntityFactory {

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