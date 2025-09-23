package okuri.core.models.block

import okuri.core.enums.core.EntityType
import java.util.*

data class BlockReference<E>(
    val id: UUID,
    val block: Block,
    val entityType: EntityType,
    val entityId: UUID,
    val entity: E
)