package okuri.core.models.block.operation

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import okuri.core.enums.block.request.BlockOperationType
import java.util.*

@JsonTypeName("MOVE_BLOCK")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class MoveBlockOperation(
    override val type: BlockOperationType = BlockOperationType.MOVE_BLOCK,
    override val blockId: UUID,
    val fromParentId: UUID? = null,
    val toParentId: UUID? = null,
) : BlockOperation