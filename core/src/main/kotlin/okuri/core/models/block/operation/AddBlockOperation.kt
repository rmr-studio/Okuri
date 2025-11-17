package okuri.core.models.block.operation

import okuri.core.enums.block.request.BlockOperationType
import okuri.core.models.block.tree.Node
import java.util.*

data class AddBlockOperation(
    override val type: BlockOperationType = BlockOperationType.ADD_BLOCK,
    override val blockId: UUID,
    val block: Node,
    val parentId: UUID? = null,
    // Only applicable to List nodes
    val index: Int? = null
) : BlockOperation