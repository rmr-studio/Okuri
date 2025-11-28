package okuri.core.models.block.operation

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import okuri.core.enums.block.request.BlockOperationType
import java.util.*

@JsonTypeName("REMOVE_BLOCK")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class RemoveBlockOperation(
    override val type: BlockOperationType = BlockOperationType.REMOVE_BLOCK,
    override val blockId: UUID,
    // Map of child block IDs to their respective parent block IDs
    val childrenIds: Map<UUID, UUID> = emptyMap<UUID, UUID>(),
    // Optional parent ID to help locate the block and remove existing references
    val parentId: UUID? = null
) : BlockOperation