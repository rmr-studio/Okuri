package okuri.core.entity.client

import okuri.core.enums.block.client.ClientType

/**
 * This data class represents a reference map to the block tree that is stored within a client object.
 * This will hold all reference id to the parent layer blocks. These can then be fetched to locate
 * all referenced children, and reconstruct the full tree structure.
 */
data class ClientTypeMetadataReference(
    val type: ClientType,
    val references: BlockTreeEntityReference
)


