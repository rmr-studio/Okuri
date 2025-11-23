package okuri.core.models.block.request

import java.util.*

/**
 * Request to hydrate (resolve entity references for) one or more blocks.
 *
 * This is used to progressively load entity data for reference blocks
 * without fetching everything upfront during initial environment load.
 *
 * @param blockIds The list of block UUIDs to hydrate.
 * @param organisationId The organisation context for authorization and filtering.
 */
data class HydrateBlocksRequest(
    val blockIds: List<UUID>,
    val organisationId: UUID
)
