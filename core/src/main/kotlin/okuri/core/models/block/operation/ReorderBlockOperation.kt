package okuri.core.models.block.operation

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import okuri.core.enums.block.request.BlockOperationType
import java.util.*

@JsonTypeName("REORDER_BLOCK")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class ReorderBlockOperation(
    override val type: BlockOperationType = BlockOperationType.REORDER_BLOCK,
    override val blockId: UUID,
    // The List node the current child block is posted under
    val parentId: UUID,
    val fromIndex: Int,
    val toIndex: Int
) : BlockOperation