package okuri.core.repository.company

import okuri.core.entity.company.CompanyEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface CompanyRepository : JpaRepository<CompanyEntity, UUID> {
    /**
 * Finds all company records that belong to the specified organisation.
 *
 * @param organisationId The UUID of the organisation to match.
 * @return A list of CompanyEntity instances whose `organisationId` equals the provided UUID; empty list if none found.
 */
fun findByOrganisationId(organisationId: UUID): List<CompanyEntity>
}