package okuri.core.models.block.request

import okuri.core.enums.core.EntityType
import java.util.*

/**
 * Request to attach a block to an entity.
 */
data class AttachBlockRequest(
    val entityId: UUID,
    val entityType: EntityType,
    val blockId: UUID,
    val key: String
)