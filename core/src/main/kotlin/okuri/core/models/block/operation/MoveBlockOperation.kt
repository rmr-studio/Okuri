package okuri.core.models.block.operation

import okuri.core.enums.block.request.BlockOperationType
import java.util.*

data class MoveBlockOperation(
    override val type: BlockOperationType = BlockOperationType.MOVE_BLOCK,
    override val blockId: UUID,
    val fromParentId: UUID? = null,
    val toParentId: UUID? = null,
) : BlockOperation