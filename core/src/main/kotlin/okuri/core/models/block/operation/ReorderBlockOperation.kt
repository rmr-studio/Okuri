package okuri.core.models.block.operation

import okuri.core.enums.block.request.BlockOperationType
import java.util.*

data class ReorderBlockOperation(
    override val type: BlockOperationType = BlockOperationType.REORDER_BLOCK,
    override val blockId: UUID,
    // The List node the current child block is posted under
    val parentId: UUID,
    val fromIndex: Int,
    val toIndex: Int
) : BlockOperation