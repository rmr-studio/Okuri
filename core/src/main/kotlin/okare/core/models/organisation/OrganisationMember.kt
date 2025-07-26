package okare.core.models.organisation


import okare.core.entity.organisation.OrganisationEntity
import okare.core.entity.organisation.OrganisationMemberEntity
import okare.core.entity.user.toDisplay
import okare.core.enums.organisation.OrganisationRoles
import okare.core.models.user.UserDisplay
import java.time.ZonedDateTime
import java.util.*

data class OrganisationMember(
    val user: UserDisplay,
    val organisationId: UUID,
    val role: OrganisationRoles,
    val memberSince: ZonedDateTime,
    val organisation: Organisation? = null
) {
    companion object Factory {
        fun fromEntity(entity: OrganisationMemberEntity, organisation: OrganisationEntity? = null): OrganisationMember {
            entity.id.let {
                entity.user.let { userEntity ->
                    if (userEntity == null) {
                        throw IllegalArgumentException("User entity cannot be null for OrganisationMember")
                    }

                    return OrganisationMember(
                        user = userEntity.toDisplay(),
                        organisationId = it.organisationId,
                        role = entity.role,
                        memberSince = entity.memberSince,
                        organisation = organisation?.let { entity -> Organisation.fromEntity(entity) }
                    )
                }

            }
        }
    }
}