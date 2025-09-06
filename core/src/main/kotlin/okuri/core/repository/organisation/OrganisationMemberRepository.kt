package okuri.core.repository.organisation

import okuri.core.entity.organisation.OrganisationMemberEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*


interface OrganisationMemberRepository :
    JpaRepository<OrganisationMemberEntity, OrganisationMemberEntity.OrganisationMemberKey> {
    fun deleteByIdOrganisationId(organisationId: UUID)
    fun findByIdUserId(userId: UUID): List<OrganisationMemberEntity>
    fun findByIdOrganisationId(organisationId: UUID): List<OrganisationMemberEntity>
}