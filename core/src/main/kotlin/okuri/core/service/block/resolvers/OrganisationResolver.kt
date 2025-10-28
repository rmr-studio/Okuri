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
     * Fetches client entities for the given set of IDs.
     *
     * @param ids The set of client UUIDs to resolve.
     * @return A map from each found client UUID to its corresponding [Organisation]; UUIDs with no matching client are omitted.
     */
    override fun fetch(ids: Set<UUID>): Map<UUID, Organisation> {
        TODO()
    }
}