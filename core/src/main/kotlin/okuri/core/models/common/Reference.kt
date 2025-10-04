package okuri.core.models.common

import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import java.util.*

data class Reference(
    val type: EntityType,
    val id: UUID,
    val path: String,
    val ownership: BlockOwnership,
    val orderIndex: Int? = null
)