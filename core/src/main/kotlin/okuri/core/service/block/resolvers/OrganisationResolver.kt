package okuri.core.service.block.resolvers

import okuri.core.enums.core.EntityType
import okuri.core.models.organisation.Organisation
import okuri.core.service.organisation.OrganisationService
import org.springframework.stereotype.Component
import java.util.*

@Component
class OrganisationResolver(
    private val service: OrganisationService
) : ReferenceResolver {
    override val type: EntityType = EntityType.ORGANISATION

    /**
     * Fetches organisation entities for the given set of IDs.
     *
     * @param ids The set of organisation UUIDs to resolve.
     * @param organisationId The organisation context for authorization (currently not used for filtering, but required by interface).
     * @return A map from each found organisation UUID to its corresponding [Organisation]; UUIDs with no matching organisation are omitted.
     */
    override fun fetch(ids: Set<UUID>, organisationId: UUID): Map<UUID, Organisation> {
        if (ids.isEmpty()) return emptyMap()

        // Fetch organisations individually
        // Note: OrganisationService currently doesn't have a batch fetch method,
        // so we fetch individually. Consider adding batch fetch in the future for performance.
        return ids.mapNotNull { id ->
            try {
                val org = service.getOrganisationById(id, includeMetadata = false)
                id to org
            } catch (e: Exception) {
                // Organisation not found or access denied - skip it
                null
            }
        }.toMap()
    }
}