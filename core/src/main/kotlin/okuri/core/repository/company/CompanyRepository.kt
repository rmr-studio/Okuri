package okuri.core.repository.company

import okuri.core.entity.company.CompanyEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface CompanyRepository : JpaRepository<CompanyEntity, UUID> {
    fun findByOrganisationId(organisationId: UUID): List<CompanyEntity>
}