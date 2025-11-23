package okuri.core.service.block.resolvers

import okuri.core.enums.core.EntityType
import okuri.core.models.block.Referenceable
import java.util.*

interface ReferenceResolver {
    val type: EntityType

    /**
     * Resolve a set of entity IDs to their corresponding Referenceable objects.
     *
     * @param ids The set of UUIDs to resolve.
     * @param organisationId The organisation context for authorization and filtering.
     * @return A map from each input UUID to its corresponding `Referenceable` instance; missing or unresolved IDs will not appear in the map.
     */
    fun fetch(ids: Set<UUID>, organisationId: UUID): Map<UUID, Referenceable>
}