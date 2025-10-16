package okuri.core.models.client

import okuri.core.enums.client.ClientType
import okuri.core.models.block.Block

data class ClientTypeMetadata(
    val type: ClientType,
    val metadata: Map<String, Block>
)
