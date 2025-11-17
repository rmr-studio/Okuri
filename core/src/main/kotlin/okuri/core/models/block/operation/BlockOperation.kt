package okuri.core.models.block.operation

import okuri.core.enums.block.request.BlockOperationType
import java.util.*

sealed interface BlockOperation {
    val type: BlockOperationType
    val blockId: UUID
}