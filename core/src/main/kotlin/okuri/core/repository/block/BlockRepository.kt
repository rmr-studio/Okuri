package okuri.core.repository.block

import okuri.core.entity.block.BlockEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockRepository : JpaRepository<BlockEntity, UUID> {
    /**
 * Retrieves all non-archived blocks belonging to the specified organisation.
 *
 * @param organisationId UUID of the organisation whose active (not archived) blocks should be returned.
 * @return A list of BlockEntity instances for the organisation where `archived` is false.
 */
fun findByOrganisationIdAndArchivedFalse(organisationId: UUID): List<BlockEntity>
}