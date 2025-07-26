package okare.core.repository.organisation

import okare.core.entity.organisation.OrganisationInviteEntity
import okare.core.enums.organisation.OrganisationInviteStatus
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*


interface OrganisationInviteRepository : JpaRepository<OrganisationInviteEntity, UUID> {
    fun findByOrganisationId(id: UUID): List<OrganisationInviteEntity>
    fun findByEmail(email: String): List<OrganisationInviteEntity>
    fun findByOrganisationIdAndEmailAndInviteStatus(
        organisationId: UUID,
        email: String,
        inviteStatus: OrganisationInviteStatus
    ): List<OrganisationInviteEntity>

    fun findByToken(token: String): Optional<OrganisationInviteEntity>
}