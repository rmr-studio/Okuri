package okuri.core.repository.block

import okuri.core.entity.block.BlockTypeEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockTypeRepository : JpaRepository<BlockTypeEntity, UUID> {
    /**
 * Retrieve a BlockTypeEntity by its key.
 *
 * @param key The unique key identifying the block type.
 * @return An Optional containing the matching BlockTypeEntity if found, or an empty Optional otherwise.
 */
fun findByKey(key: String): Optional<BlockTypeEntity>
    /**
 * Retrieve block types that belong to the specified organisation or are marked as system-wide.
 *
 * @param organisationId Organisation UUID to filter by; pass `null` to omit organisation-specific filtering.
 * @param system When `true`, include block types that are marked as system-wide.
 * @return `List<BlockTypeEntity>` containing entities that match the organisation ID or have the system flag, possibly empty.
 */
fun findByOrganisationIdOrSystem(organisationId: UUID?, system: Boolean = true): List<BlockTypeEntity>
    /**
 * Fetches the latest BlockTypeEntity for the given organisation and key.
 *
 * @param organisationId UUID of the organisation to match.
 * @param key Identifier of the block type.
 * @return The BlockTypeEntity with the highest version for the organisation and key, or `null` if none exists.
 */
fun findTopByOrganisationIdAndKeyOrderByVersionDesc(organisationId: UUID, key: String): BlockTypeEntity?
    /**
 * Finds a block type matching the specified organisation, key, and version.
 *
 * @param organisationId The UUID of the organisation to which the block type belongs.
 * @param key The block type's unique key.
 * @param version The exact version number to match.
 * @return An Optional containing the matching BlockTypeEntity if found, or empty otherwise.
 */
fun findByOrganisationIdAndKeyAndVersion(organisationId: UUID, key: String, version: Int): Optional<BlockTypeEntity>
    /**
 * Retrieve the latest system-wide BlockTypeEntity for the given key.
 *
 * @param key The block type key to match.
 * @return The most recent system-wide BlockTypeEntity with the given key, or `null` if none exists.
 */
fun findTopBySystemTrueAndKeyOrderByVersionDesc(key: String): BlockTypeEntity?
    /**
 * Retrieves a system-wide BlockTypeEntity that matches the specified key and version.
 *
 * @param key The block type key to match.
 * @param version The exact version to match.
 * @return An Optional containing the matching BlockTypeEntity if found, empty otherwise.
 */
fun findBySystemTrueAndKeyAndVersion(key: String, version: Int): Optional<BlockTypeEntity>
}