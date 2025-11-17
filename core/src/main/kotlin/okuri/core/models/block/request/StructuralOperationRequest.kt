package okuri.core.models.block.request

import okuri.core.models.block.operation.BlockOperation
import java.util.*

data class StructuralOperationRequest(
    val id: UUID,
    val timestamp: Long,
    val data: BlockOperation
)