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
     * @return A map from each found client UUID to its corresponding [Client]; UUIDs with no matching client are omitted.
     */
    override fun fetch(ids: Set<UUID>): Map<UUID, Client> {
        TODO()
    }
}