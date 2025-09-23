package okuri.core.models.block

import okuri.core.enums.core.EntityType
import java.util.*

data class BlockReference<T>(
    val id: UUID,
    val block: Block,
    val entityType: EntityType,
    val entityId: UUID,
    val entity: T
)