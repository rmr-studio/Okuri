package okuri.core.models.block

import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import java.util.*

data class BlockReference<E>(
    val id: UUID,
    val entityType: EntityType,
    val entityId: UUID,
    val entity: E?,
    val ownership: BlockOwnership,
    val blockId: UUID,
    val orderIndex: Int? = null,
    val path: String,
)