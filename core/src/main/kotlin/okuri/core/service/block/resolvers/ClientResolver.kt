package okuri.core.service.block.resolvers

import okuri.core.entity.client.ClientEntity
import okuri.core.service.client.ClientService
import org.springframework.stereotype.Component
import java.util.*

@Component
class ClientResolver(
    private val clientService: ClientService
) : ReferenceResolver {
    override val type = okuri.core.enums.core.EntityType.CLIENT
    override fun fetch(ids: Set<UUID>): Map<UUID, ClientEntity> {
        TODO()
    }
}