package okuri.core.models.block.request.operation

import okuri.core.enums.block.request.BlockOperationType
import java.util.*

data class RemoveBlockOperation(
    override val type: BlockOperationType = BlockOperationType.REMOVE_BLOCK,
    override val blockId: UUID,
    // Optional parent ID to help locate the block and remove existing references
    val parentId: UUID? = null
) : BlockOperation