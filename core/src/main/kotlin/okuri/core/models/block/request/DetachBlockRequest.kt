package okuri.core.models.block.request

import okuri.core.enums.core.EntityType
import java.util.*

data class DetachBlockRequest(
    val entityId: UUID,
    val entityType: EntityType,
    val blockId: UUID
)