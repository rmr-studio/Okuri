package okuri.core.models.block.operation

import okuri.core.enums.block.request.BlockOperationType
import okuri.core.models.block.tree.Node
import java.util.UUID

data class UpdateBlockOperation(
    override val type: BlockOperationType = BlockOperationType.UPDATE_BLOCK,
    override val blockId: UUID,
    val updatedContent: Node
): BlockOperation