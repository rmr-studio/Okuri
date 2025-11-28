package okuri.core.service.block.resolvers

import okuri.core.models.client.Client
import okuri.core.service.client.ClientService
import org.springframework.stereotype.Component
import java.util.*

@Component
class ClientResolver(
    private val clientService: ClientService
) : ReferenceResolver {
    override val type = okuri.core.enums.core.EntityType.CLIENT

    /**
     * Fetches client entities for the given set of IDs.
     *
     * @param ids The set of client UUIDs to resolve.
     * @param organisationId The organisation context for authorization and filtering.
     * @return A map from each found client UUID to its corresponding [Client]; UUIDs with no matching client are omitted.
     */
    override fun fetch(ids: Set<UUID>, organisationId: UUID): Map<UUID, Client> {
        if (ids.isEmpty()) return emptyMap()

        // Fetch all clients for the organisation
        val allClients = clientService.getOrganisationClients(organisationId)

        // Filter to requested IDs and convert to Client model
        return allClients
            .filter { it.id in ids }
            .associate { it.id!! to it.toModel() }
    }
}