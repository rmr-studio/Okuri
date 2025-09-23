package okuri.core.models.block

import okuri.core.enums.block.EntityType
import java.util.*

data class BlockReference<T>(
    val id: UUID,
    val block: Block,
    val entityType: EntityType,
    val entityId: UUID,
    val entity: T
)