package okuri.core.models.block.response.internal

import okuri.core.entity.block.BlockChildEntity
import java.util.*

data class CascadeRemovalResult(
    val blocksToDelete: Set<UUID>,
    val childEntitiesToDelete: List<BlockChildEntity>
)
